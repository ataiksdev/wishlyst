from fastapi import APIRouter, Depends
from ..database import get_db

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])

@router.get("")
async def get_discovery(db=Depends(get_db)):
    cur = db.cursor()
    
    # 1. Trending Items Logic
    cur.execute("""
        SELECT 
            name, 
            url, 
            image_url, 
            price, 
            currency,
            COUNT(*) as occurrences
        FROM wishlist_items i
        JOIN wishlists w ON i.wishlist_id = w.id
        WHERE w.is_public = true
        GROUP BY name, url, image_url, price, currency
        ORDER BY occurrences DESC
        LIMIT 10
    """)
    trending = cur.fetchall()
    
    # 2. Promoted Items
    cur.execute("SELECT * FROM promoted_items ORDER BY created_at DESC LIMIT 10")
    promoted = cur.fetchall()
    for p in promoted:
        p["id"] = str(p["id"])
        if p["created_at"]:
            p["created_at"] = p["created_at"].isoformat()
    
    # 3. Promoted Wishlists (Curated Collections)
    curated_sql = """
        SELECT pw.category, w.title, w.slug, w.description,
               (SELECT i.image_url FROM wishlist_items i WHERE i.wishlist_id = w.id AND i.image_url IS NOT NULL LIMIT 1) as cover_image,
               (SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = w.id) as item_count,
               u.name as owner_name
        FROM promoted_wishlists pw
        JOIN wishlists w ON pw.wishlist_id = w.id
        JOIN users u ON w.user_id = u.id
        ORDER BY pw.display_order ASC, pw.created_at DESC
        LIMIT 10
    """
    cur.execute(curated_sql)
    curated = cur.fetchall()
    
    return {
        "trending": trending,
        "promoted": promoted,
        "curated": curated
    }
