from fastapi import Request, Depends, HTTPException
from .database import get_db

async def get_current_user(
    request: Request,
    db=Depends(get_db),
):
    token = request.cookies.get("session_token")
    if not token:
        # Fallback to Bearer token for existing clients during migration (optional)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    cur = db.cursor()
    cur.execute(
        "SELECT s.user_id, u.id, u.email, u.name, u.is_admin FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return row

async def get_admin_user(user=Depends(get_current_user)):
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_user_if_authenticated(
    request: Request,
    db=Depends(get_db),
):
    token = request.cookies.get("session_token")
    if not token:
         # Fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None

    cur = db.cursor()
    cur.execute(
        "SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,),
    )
    return cur.fetchone()
