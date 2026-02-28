import os
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from ..database import get_db
from ..schemas import UserRegister, UserLogin, PasswordResetRequest, PasswordResetConfirm
from ..utils import hash_password, verify_password, create_session_token, get_limit
from ..deps import get_current_user
from ..limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register")
@limiter.limit(get_limit("500/hour"))
async def register(request: Request, body: UserRegister, response: Response, db=Depends(get_db)):

    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
    if cur.fetchone():
        raise HTTPException(status_code=409, detail="Email already registered")

    pw_hash = hash_password(body.password)
    answer_hash = hash_password(body.security_answer) if body.security_answer else None
    user_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO users (id, email, password_hash, name, security_question, security_answer_hash) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, email, name, created_at",
        (user_id, body.email, pw_hash, body.name, body.security_question, answer_hash),
    )
    user = cur.fetchone()

    token = create_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user["id"], token, expires),
    )
    db.commit()

    # Set HTTP-only cookie
    is_prod = os.environ.get("ENV", "development") == "production"
    is_remote = "localhost" not in str(request.base_url) and "127.0.0.1" not in str(request.base_url)
    use_secure = is_prod or is_remote
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=use_secure,
        samesite="none" if use_secure else "lax",
        max_age=30 * 24 * 60 * 60 # 30 days
    )

    return {
        "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"]},
    }

@router.post("/login")
@limiter.limit(get_limit("10/minute"))
async def login(request: Request, body: UserLogin, response: Response, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id, email, name, password_hash FROM users WHERE email = %s", (body.email,))
    user = cur.fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user["id"], token, expires),
    )
    db.commit()

    # Set HTTP-only cookie
    is_prod = os.environ.get("ENV", "development") == "production"
    is_remote = "localhost" not in str(request.base_url) and "127.0.0.1" not in str(request.base_url)
    use_secure = is_prod or is_remote
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=use_secure,
        samesite="none" if use_secure else "lax",
        max_age=30 * 24 * 60 * 60
    )

    return {
        "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"]},
    }

@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    db=Depends(get_db),
):
    token = request.cookies.get("session_token")
    if token:
        cur = db.cursor()
        cur.execute("DELETE FROM sessions WHERE token = %s", (token,))
        db.commit()
    
    response.delete_cookie(key="session_token")
    return {"status": "ok"}

@router.get("/me")
@limiter.limit(get_limit("60/minute"))
async def get_me(request: Request, user=Depends(get_current_user)):
    return {"id": str(user["id"]), "email": user["email"], "name": user["name"], "is_admin": user.get("is_admin", False)}

@router.post("/forgot-password/question")
async def get_reset_question(body: PasswordResetRequest, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT security_question FROM users WHERE email = %s", (body.email.lower(),))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User almost not found")
    if not row["security_question"]:
        raise HTTPException(status_code=400, detail="User has no security question set. Please contact admin.")
    return {"question": row["security_question"]}

@router.post("/forgot-password/reset")
async def reset_password(body: PasswordResetConfirm, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT security_answer_hash FROM users WHERE email = %s", (body.email.lower(),))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User almost not found")
    
    if not row["security_answer_hash"] or not verify_password(body.answer, row["security_answer_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect answer to security question")
    
    new_pw_hash = hash_password(body.new_password)
    cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (new_pw_hash, body.email.lower()))
    db.commit()
    
    return {"message": "Password reset successfully"}
