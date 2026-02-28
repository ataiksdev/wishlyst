import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import get_db
from ..schemas import WishlistCreate, WishlistUpdate, WishlistClone
from ..utils import generate_slug
from ..deps import get_current_user, get_user_if_authenticated

router = APIRouter(prefix="/api/wishlists", tags=["Wishlists"])

@router.post("")
async def create_wishlist(
    body: WishlistCreate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    slug = generate_slug(body.title)
    cur.execute(
        "INSERT INTO wishlists (user_id, title, description, slug, is_public) VALUES (%s, %s, %s, %s, %s) RETURNING id, user_id, title, description, slug, is_public, view_count, like_count, created_at",
        (user["id"], body.title, body.description, slug, body.is_public),
    )
    wishlist = cur.fetchone()
    db.commit()

    result = dict(wishlist)
    result["id"] = str(result["id"])
    result["user_id"] = str(result["user_id"])
    return result

@router.get("")
async def list_user_wishlists(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        "SELECT id, title, description, slug, is_public, view_count, like_count, created_at FROM wishlists WHERE user_id = %s ORDER BY created_at DESC",
        (user["id"],),
    )
    rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        d["id"] = str(d["id"])
        # Get item count
        cur.execute("SELECT COUNT(*) as count FROM wishlist_items WHERE wishlist_id = %s", (row["id"],))
        d["item_count"] = cur.fetchone()["count"]
        result.append(d)
    return result

@router.get("/{slug}")
async def get_wishlist_by_slug(
    slug: str, 
    request: Request, 
    user=Depends(get_user_if_authenticated),
    db=Depends(get_db)
):
    cur = db.cursor()
    cur.execute(
        "SELECT w.id, w.user_id, w.title, w.description, w.slug, w.is_public, w.view_count, w.like_count, w.created_at, u.name as owner_name FROM wishlists w JOIN users u ON w.user_id = u.id WHERE w.slug = %s",
        (slug,),
    )
    wishlist = cur.fetchone()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    is_owner = user and str(user["id"]) == str(wishlist["user_id"])
    
    if not wishlist["is_public"] and not is_owner:
        raise HTTPException(status_code=403, detail="This wishlist is private")

    # Record the view only for public viewers
    if not is_owner:
        viewer_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        user_agent = request.headers.get("user-agent", "")
        referrer = request.headers.get("referer", "")
        cur.execute(
            "INSERT INTO wishlist_views (wishlist_id, viewer_ip, user_agent, referrer) VALUES (%s, %s, %s, %s)",
            (wishlist["id"], viewer_ip, user_agent, referrer),
        )
        cur.execute(
            "UPDATE wishlists SET view_count = view_count + 1 WHERE id = %s",
            (wishlist["id"],),
        )

    # Get items
    cur.execute(
        "SELECT id, name, price, currency, tag, url, image_url, created_at FROM wishlist_items WHERE wishlist_id = %s ORDER BY created_at ASC",
        (wishlist["id"],),
    )
    items = cur.fetchall()
    
    # Enrich items with reservations
    enriched_items = []
    for item in items:
        cur.execute(
            "SELECT id, name, reserved_at FROM item_reservations WHERE item_id = %s ORDER BY reserved_at ASC",
            (item["id"],),
        )
        reservations = cur.fetchall()
        
        item_data = dict(item)
        item_data["id"] = str(item["id"])
        item_data["price"] = float(item["price"]) if item["price"] else None
        item_data["reservations_count"] = len(reservations)
        
        if is_owner:
            item_data["reservations"] = [
                {"id": str(r["id"]), "name": r["name"], "reserved_at": r["reserved_at"].isoformat()}
                for r in reservations
            ]
            item_data["is_claimed"] = len(reservations) > 0
            item_data["claimed_by"] = reservations[0]["name"] if reservations else None
        else:
            item_data["is_claimed"] = len(reservations) > 0
            item_data["reserver_initials"] = [
                "".join([n[0] for n in r["name"].split() if n]).upper()
                for r in reservations
            ]
        
        enriched_items.append(item_data)

    db.commit()

    result = dict(wishlist)
    result["id"] = str(result["id"])
    result["user_id"] = str(result["user_id"])
    result["view_count"] = result["view_count"] + (0 if is_owner else 1)
    result["items"] = enriched_items
    return result

@router.post("/{slug}/like")
async def like_wishlist(slug: str, request: Request, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id FROM wishlists WHERE slug = %s", (slug,))
    wishlist = cur.fetchone()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    viewer_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    
    cur.execute(
        "SELECT id FROM wishlist_likes WHERE wishlist_id = %s AND viewer_ip = %s",
        (wishlist["id"], viewer_ip),
    )
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="You have already liked this wishlist")
    
    try:
        cur.execute(
            "INSERT INTO wishlist_likes (wishlist_id, viewer_ip) VALUES (%s, %s)",
            (wishlist["id"], viewer_ip),
        )
        cur.execute(
            "UPDATE wishlists SET like_count = like_count + 1 WHERE id = %s RETURNING like_count",
            (wishlist["id"],),
        )
        new_count = cur.fetchone()["like_count"]
        db.commit()
        return {"like_count": new_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{wishlist_id}")
async def update_wishlist(
    wishlist_id: str,
    body: WishlistUpdate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute("SELECT id, user_id FROM wishlists WHERE id = %s", (wishlist_id,))
    wishlist = cur.fetchone()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if str(wishlist["user_id"]) != str(user["id"]):
        raise HTTPException(status_code=403, detail="Not your wishlist")

    updates = []
    values = []
    if body.title is not None:
        updates.append("title = %s")
        values.append(body.title)
    if body.description is not None:
        updates.append("description = %s")
        values.append(body.description)
    if body.is_public is not None:
        updates.append("is_public = %s")
        values.append(body.is_public)

    if updates:
        updates.append("updated_at = NOW()")
        values.append(wishlist_id)
        cur.execute(
            f"UPDATE wishlists SET {', '.join(updates)} WHERE id = %s RETURNING id, title, description, slug, is_public, view_count, created_at, updated_at",
            values,
        )
        result = dict(cur.fetchone())
        result["id"] = str(result["id"])
        db.commit()
        return result

    return {"status": "no changes"}

@router.delete("/{wishlist_id}")
async def delete_wishlist(
    wishlist_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute("SELECT id, user_id FROM wishlists WHERE id = %s", (wishlist_id,))
    wishlist = cur.fetchone()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if str(wishlist["user_id"]) != str(user["id"]):
        raise HTTPException(status_code=403, detail="Not your wishlist")
    cur.execute("DELETE FROM wishlists WHERE id = %s", (wishlist_id,))
    db.commit()
    return {"status": "deleted"}

@router.post("/{slug}/clone")
async def clone_wishlist(slug: str, body: WishlistClone, user=Depends(get_current_user), db=Depends(get_db)):
    import secrets
    cur = db.cursor()
    cur.execute("SELECT id, is_public, title FROM wishlists WHERE slug = %s", (slug,))
    original = cur.fetchone()
    if not original:
        raise HTTPException(status_code=404, detail="Original wishlist not found")
    
    if not original["is_public"]:
        raise HTTPException(status_code=403, detail="Cannot clone a private wishlist")
    
    new_wishlist_id = str(uuid.uuid4())
    new_slug = generate_slug(body.title)
    
    cur.execute("SELECT id FROM wishlists WHERE slug = %s", (new_slug,))
    if cur.fetchone():
        new_slug = f"{new_slug}-{secrets.token_hex(3)}"
        
    cur.execute(
        "INSERT INTO wishlists (id, user_id, title, slug, is_public) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        (new_wishlist_id, user["id"], body.title, new_slug, True)
    )
    new_wishlist = cur.fetchone()
    
    cur.execute("""
        INSERT INTO wishlist_items (id, wishlist_id, name, price, currency, tag, url, image_url)
        SELECT gen_random_uuid(), %s, name, price, currency, tag, url, image_url
        FROM wishlist_items
        WHERE wishlist_id = %s
    """, (new_wishlist_id, original["id"]))
    
    db.commit()
    
    new_wishlist_dict = dict(new_wishlist)
    new_wishlist_dict["id"] = str(new_wishlist_dict["id"])
    new_wishlist_dict["user_id"] = str(new_wishlist_dict["user_id"])
    new_wishlist_dict["created_at"] = new_wishlist_dict["created_at"].isoformat()
    return new_wishlist_dict

@router.get("/{wishlist_id}/analytics")
async def get_wishlist_analytics(
    wishlist_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute("SELECT id, user_id, view_count, title FROM wishlists WHERE id = %s", (wishlist_id,))
    wishlist = cur.fetchone()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if str(wishlist["user_id"]) != str(user["id"]):
        raise HTTPException(status_code=403, detail="Not your wishlist")

    cur.execute(
        """
        SELECT DATE(viewed_at) as date, COUNT(*) as views
        FROM wishlist_views
        WHERE wishlist_id = %s AND viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(viewed_at)
        ORDER BY date ASC
        """,
        (wishlist_id,),
    )
    daily_views = [{"date": str(row["date"]), "views": row["views"]} for row in cur.fetchall()]

    cur.execute(
        "SELECT COUNT(DISTINCT viewer_ip) as unique_viewers FROM wishlist_views WHERE wishlist_id = %s",
        (wishlist_id,),
    )
    unique_viewers = cur.fetchone()["unique_viewers"]

    cur.execute(
        """
        SELECT referrer, COUNT(*) as count
        FROM wishlist_views
        WHERE wishlist_id = %s AND referrer IS NOT NULL AND referrer != ''
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 5
        """,
        (wishlist_id,),
    )
    top_referrers = [dict(row) for row in cur.fetchall()]

    return {
        "wishlist_id": str(wishlist_id),
        "title": wishlist["title"],
        "total_views": wishlist["view_count"],
        "unique_viewers": unique_viewers,
        "daily_views": daily_views,
        "top_referrers": top_referrers,
    }
