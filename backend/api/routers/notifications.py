from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _serialize(row: dict) -> dict:
    d = dict(row)
    d["id"] = str(d["id"])
    d["user_id"] = str(d["user_id"])
    if d.get("wishlist_id"):
        d["wishlist_id"] = str(d["wishlist_id"])
    if d.get("item_id"):
        d["item_id"] = str(d["item_id"])
    if d.get("created_at"):
        d["created_at"] = d["created_at"].isoformat()
    return d


@router.get("")
async def list_notifications(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        """
        SELECT id, user_id, type, title, message,
               wishlist_id, item_id, is_read, created_at
        FROM notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 50
        """,
        (user["id"],),
    )
    rows = cur.fetchall()
    return [_serialize(r) for r in rows]


@router.get("/unread-count")
async def unread_count(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = FALSE",
        (user["id"],),
    )
    return {"count": cur.fetchone()["count"]}


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
        (notification_id, user["id"]),
    )
    db.commit()
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_read(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
        (user["id"],),
    )
    db.commit()
    return {"status": "ok"}
