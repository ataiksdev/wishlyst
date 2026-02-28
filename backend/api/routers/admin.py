import uuid
import psycopg2
from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import get_db
from ..schemas import AdminPasswordReset, PromotedItemCreate, PromotedWishlistCreate
from ..utils import hash_password
from ..deps import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
async def get_admin_stats(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    
    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()["count"]
    
    cur.execute("SELECT COUNT(*) FROM wishlists")
    total_wishlists = cur.fetchone()["count"]
    
    cur.execute("SELECT SUM(view_count) FROM wishlists")
    total_views = cur.fetchone()["sum"] or 0
    
    cur.execute("SELECT COUNT(*) FROM wishlist_likes")
    total_likes = cur.fetchone()["count"]
    
    cur.execute("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'")
    new_users_30d = cur.fetchone()["count"]
    
    return {
        "total_users": total_users,
        "total_wishlists": total_wishlists,
        "total_views": total_views,
        "total_likes": total_likes,
        "new_users_30d": new_users_30d,
    }

@router.get("/users")
async def get_admin_users(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT u.id, u.email, u.name, u.is_admin, u.created_at,
               (SELECT COUNT(*) FROM wishlists WHERE user_id = u.id) as wishlist_count
        FROM users u
        ORDER BY u.created_at DESC
    """)
    rows = cur.fetchall()
    for row in rows:
        row["id"] = str(row["id"])
        row["created_at"] = row["created_at"].isoformat()
    return rows

@router.get("/wishlists")
async def get_admin_wishlists(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT w.id, w.title, w.slug, w.view_count, w.like_count, w.is_public, w.created_at,
               u.name as owner_name, u.email as owner_email,
               (SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = w.id) as item_count
        FROM wishlists w
        JOIN users u ON w.user_id = u.id
        ORDER BY w.created_at DESC
    """)
    rows = cur.fetchall()
    for row in rows:
        row["id"] = str(row["id"])
        row["created_at"] = row["created_at"].isoformat()
    return rows

@router.get("/analytics")
async def get_admin_analytics(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    
    cur.execute("""
        SELECT DATE(viewed_at) as date, COUNT(*) as views
        FROM wishlist_views
        WHERE viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(viewed_at)
        ORDER BY date ASC
    """)
    daily_views = [{"date": str(row["date"]), "views": row["views"]} for row in cur.fetchall()]
    
    cur.execute("""
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM wishlists
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    """)
    daily_wishlists = [{"date": str(row["date"]), "count": row["count"]} for row in cur.fetchall()]
    
    return {
        "daily_views": daily_views,
        "daily_wishlists": daily_wishlists
    }

@router.get("/users/{user_id}")
async def get_admin_user_detail(user_id: str, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    
    cur.execute("SELECT id, email, name, is_admin, created_at FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["id"] = str(user["id"])
    user["created_at"] = user["created_at"].isoformat()
    
    cur.execute("""
        SELECT id, title, slug, view_count, like_count, is_public, created_at,
               (SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = wishlists.id) as item_count
        FROM wishlists
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    wishlists = cur.fetchall()
    for w in wishlists:
        w["id"] = str(w["id"])
        w["created_at"] = w["created_at"].isoformat()
    
    cur.execute("SELECT COUNT(*) FROM wishlists WHERE user_id = %s", (user_id,))
    total_wishlists = cur.fetchone()["count"]
    
    cur.execute("SELECT SUM(view_count) FROM wishlists WHERE user_id = %s", (user_id,))
    total_views = cur.fetchone()["sum"] or 0
    
    cur.execute("""
        SELECT DATE(v.viewed_at) as date, COUNT(*) as views
        FROM wishlist_views v
        JOIN wishlists w ON v.wishlist_id = w.id
        WHERE w.user_id = %s AND v.viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(v.viewed_at)
        ORDER BY date ASC
    """, (user_id,))
    daily_views = [{"date": str(row["date"]), "views": row["views"]} for row in cur.fetchall()]
    
    return {
        "profile": user,
        "wishlists": wishlists,
        "stats": {
            "total_wishlists": total_wishlists,
            "total_views": total_views,
            "daily_views": daily_views
        }
    }

@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, body: AdminPasswordReset, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    
    new_pw_hash = hash_password(body.new_password)
    cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_pw_hash, user_id))
    db.commit()
    
    return {"message": "User password reset successfully"}

@router.get("/promoted")
async def list_admin_promoted(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT * FROM promoted_items ORDER BY created_at DESC")
    items = cur.fetchall()
    for i in items:
        i["id"] = str(i["id"])
        i["created_at"] = i["created_at"].isoformat()
    return items

@router.post("/promoted")
async def create_promoted_item(body: PromotedItemCreate, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    item_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO promoted_items (id, name, description, price, currency, url, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """, (item_id, body.name, body.description, body.price, body.currency, body.url, body.image_url))
    item = cur.fetchone()
    db.commit()
    item["id"] = str(item["id"])
    item["created_at"] = item["created_at"].isoformat()
    return item

@router.delete("/promoted/{item_id}")
async def delete_promoted_item(item_id: str, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("DELETE FROM promoted_items WHERE id = %s", (item_id,))
    db.commit()
    return {"message": "Success"}

@router.get("/promoted/wishlists")
async def list_admin_promoted_wishlists(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT pw.id, pw.wishlist_id, pw.category, pw.display_order, pw.created_at,
               w.title, w.slug, u.name as owner_name
        FROM promoted_wishlists pw
        JOIN wishlists w ON pw.wishlist_id = w.id
        JOIN users u ON w.user_id = u.id
        ORDER BY pw.display_order ASC, pw.created_at DESC
    """)
    rows = cur.fetchall()
    for row in rows:
        row["id"] = str(row["id"])
        row["wishlist_id"] = str(row["wishlist_id"])
        row["created_at"] = row["created_at"].isoformat()
    return rows

@router.post("/promoted/wishlists")
async def create_promoted_wishlist(body: PromotedWishlistCreate, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    try:
        cur.execute("""
            INSERT INTO promoted_wishlists (wishlist_id, category)
            VALUES (%s, %s)
            RETURNING id, wishlist_id, category, display_order, created_at
        """, (body.wishlist_id, body.category))
        db.commit()
        row = cur.fetchone()
        row["id"] = str(row["id"])
        row["wishlist_id"] = str(row["wishlist_id"])
        row["created_at"] = row["created_at"].isoformat()
        return row
    except psycopg2.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Wishlist is already promoted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/promoted/wishlists/{promoted_id}")
async def delete_promoted_wishlist(promoted_id: str, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("DELETE FROM promoted_wishlists WHERE id = %s", (promoted_id,))
    db.commit()
    return {"message": "Success"}
