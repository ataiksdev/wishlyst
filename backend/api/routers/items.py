from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..schemas import WishlistItemCreate, WishlistItemUpdate, ClaimItem, UnclaimItem
from ..deps import get_current_user

router = APIRouter(prefix="/api", tags=["Items"])

@router.post("/wishlists/{wishlist_id}/items")
async def add_item(
    wishlist_id: str,
    body: WishlistItemCreate,
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

    cur.execute(
        "INSERT INTO wishlist_items (wishlist_id, name, price, currency, tag, url, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, wishlist_id, name, price, currency, tag, url, image_url, is_claimed, created_at",
        (wishlist_id, body.name, body.price, body.currency, body.tag, body.url, body.image_url),
    )
    item = cur.fetchone()
    db.commit()

    result = dict(item)
    result["id"] = str(result["id"])
    result["wishlist_id"] = str(result["wishlist_id"])
    result["price"] = float(result["price"]) if result["price"] else None
    return result

@router.put("/wishlists/{wishlist_id}/items/{item_id}")
async def update_item(
    wishlist_id: str,
    item_id: str,
    body: WishlistItemUpdate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute("SELECT w.user_id FROM wishlists w JOIN wishlist_items i ON i.wishlist_id = w.id WHERE w.id = %s AND i.id = %s", (wishlist_id, item_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    if str(row["user_id"]) != str(user["id"]):
        raise HTTPException(status_code=403, detail="Not your wishlist")

    updates = []
    values = []
    for field in ["name", "price", "currency", "tag", "url", "image_url"]:
        val = getattr(body, field, None)
        if val is not None:
            updates.append(f"{field} = %s")
            values.append(val)
    if updates:
        updates.append("updated_at = NOW()")
        values.append(item_id)
        cur.execute(
            f"UPDATE wishlist_items SET {', '.join(updates)} WHERE id = %s RETURNING id, name, price, currency, tag, url, image_url, is_claimed, created_at",
            values,
        )
        result = dict(cur.fetchone())
        result["id"] = str(result["id"])
        result["price"] = float(result["price"]) if result["price"] else None
        db.commit()
        return result
    return {"status": "no changes"}

@router.delete("/wishlists/{wishlist_id}/items/{item_id}")
async def delete_item(
    wishlist_id: str,
    item_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute("SELECT w.user_id FROM wishlists w JOIN wishlist_items i ON i.wishlist_id = w.id WHERE w.id = %s AND i.id = %s", (wishlist_id, item_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    if str(row["user_id"]) != str(user["id"]):
        raise HTTPException(status_code=403, detail="Not your wishlist")
    cur.execute("DELETE FROM wishlist_items WHERE id = %s", (item_id,))
    db.commit()
    return {"status": "deleted"}

@router.post("/wishlists/{slug}/items/{item_id}/claim")
async def claim_item(slug: str, item_id: str, body: ClaimItem, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        "SELECT i.id FROM wishlist_items i JOIN wishlists w ON i.wishlist_id = w.id WHERE w.slug = %s AND i.id = %s AND w.is_public = true",
        (slug, item_id),
    )
    item = cur.fetchone()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    cur.execute(
        "INSERT INTO item_reservations (item_id, name) VALUES (%s, %s) RETURNING id, name, reserved_at",
        (item_id, body.name),
    )
    reservation = cur.fetchone()
    
    cur.execute(
        "UPDATE wishlist_items SET is_claimed = true, claimed_by = %s, claimed_at = NOW() WHERE id = %s",
        (body.name, item_id),
    )
    
    db.commit()
    return {
        "id": str(reservation["id"]),
        "name": reservation["name"],
        "reserved_at": reservation["reserved_at"].isoformat()
    }

@router.post("/wishlists/{slug}/items/{item_id}/unclaim")
async def unclaim_item(slug: str, item_id: str, body: UnclaimItem, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        "SELECT i.id FROM wishlist_items i JOIN wishlists w ON i.wishlist_id = w.id WHERE w.slug = %s AND i.id = %s",
        (slug, item_id),
    )
    item = cur.fetchone()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    cur.execute(
        "DELETE FROM item_reservations WHERE item_id = %s AND name = %s",
        (item_id, body.name),
    )
    
    cur.execute("SELECT COUNT(*) as count FROM item_reservations WHERE item_id = %s", (item_id,))
    rem_count = cur.fetchone()["count"]
    if rem_count == 0:
        cur.execute(
            "UPDATE wishlist_items SET is_claimed = false, claimed_by = NULL, claimed_at = NULL WHERE id = %s",
            (item_id,),
        )
    
    db.commit()
    return {"status": "unclaimed", "remaining": rem_count}
