import os
import re
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlparse
from dotenv import load_dotenv

import requests as http_requests
from bs4 import BeautifulSoup

load_dotenv()

import bcrypt
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Request, Depends, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr

# ── Rate Limiting Setup ──────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

# index.py — replace the limiter setup with this:
def get_limit(limit_string: str) -> str:
    if os.environ.get("ENV") == "test":
        return "10000/minute"
    return limit_string

# ── Pydantic Models ──────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    answer: str
    new_password: str

class AdminPasswordReset(BaseModel):
    new_password: str

class UserLogin(BaseModel):
    email: str
    password: str

class WishlistCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = True

class WishlistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class WishlistItemCreate(BaseModel):
    name: str
    price: Optional[float] = None
    currency: str = "NGN"
    tag: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class WishlistItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    tag: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class ClaimItem(BaseModel):
    name: str

class UnclaimItem(BaseModel):
    name: str

class WishlistClone(BaseModel):
    title: str

class PromotedItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "NGN"
    url: Optional[str] = None
    image_url: Optional[str] = None

class PromotedItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class PromotedWishlistCreate(BaseModel):
    wishlist_id: str
    category: Optional[str] = "Seasonal"

class PromotedWishlistUpdate(BaseModel):
    category: Optional[str] = None
    display_order: Optional[int] = None

class ScrapeRequest(BaseModel):
    url: str

# ── App Setup ────────────────────────────────────────────────────────

app = FastAPI(
    title="Wishly API",
    description="Backend API for the Wishly wishlist platform",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database Connection ──────────────────────────────────────────────

def get_db():
    conn = psycopg2.connect(
        os.environ["DATABASE_URL"],
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    try:
        yield conn
    finally:
        conn.close()

# ── Auth Helpers ─────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_session_token() -> str:
    return secrets.token_urlsafe(48)

def generate_slug(title: str) -> str:
    base = title.lower().strip()
    base = "".join(c if c.isalnum() or c == " " else "" for c in base)
    base = base.replace(" ", "-")[:60]
    suffix = secrets.token_hex(4)
    return f"{base}-{suffix}"

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

# ── Health Check ─────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/debug/{full_path:path}")
async def debug_route(full_path: str, request: Request):
    return {
        "received_path": str(request.url.path),
        "full_path_param": full_path,
        "method": request.method,
        "base_url": str(request.base_url),
    }

# ── URL Scraper ───────────────────────────────────────────────────────

def _detect_currency(text: str, domain: str) -> str:
    """Detect currency from price text or domain TLD."""
    if not text:
        text = ""
    text_upper = text.upper()
    if "₦" in text or "NGN" in text_upper:
        return "NGN"
    if "$" in text and "USD" not in text_upper and ".ng" not in domain:
        return "USD"
    if "£" in text or "GBP" in text_upper:
        return "GBP"
    if "€" in text or "EUR" in text_upper:
        return "EUR"
    if "¥" in text or "CNY" in text_upper or "JPY" in text_upper:
        return "CNY"
    if ".ng" in domain or ".com.ng" in domain:
        return "NGN"
    if ".co.uk" in domain or ".uk" in domain:
        return "GBP"
    if ".de" in domain or ".fr" in domain or ".eu" in domain:
        return "EUR"
    return "USD"  # default

def _extract_price(text: str) -> Optional[float]:
    """Extract a numeric price from a string like '$12.99' or '₦45,000'."""
    if not text:
        return None
    # Remove currency symbols and thousands separators, keep decimal
    cleaned = re.sub(r"[^\d.,]", "", text.strip())
    # Handle comma as thousands separator (e.g. 45,000 or 1,234.56)
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned and cleaned.count(",") == 1 and len(cleaned.split(",")[1]) == 2:
        cleaned = cleaned.replace(",", ".")
    else:
        cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None

@app.post("/api/scrape")
@limiter.limit(get_limit("30/minute"))
async def scrape_url(request: Request, body: ScrapeRequest, user=Depends(get_current_user)):
    """Scrape product details from an e-commerce URL."""
    url = body.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        resp = http_requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        resp.raise_for_status()
    except http_requests.exceptions.Timeout:
        raise HTTPException(status_code=408, detail="The product page took too long to respond")
    except http_requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Could not reach the product page: {str(e)}")

    soup = BeautifulSoup(resp.text, "html.parser")

    name = None
    price_text = None
    image_url = None

    # ── Strategy 1: Open Graph tags (most reliable, used by Temu, Amazon, etc.) ──
    og_title = soup.find("meta", property="og:title")
    og_image = soup.find("meta", property="og:image")
    og_price = soup.find("meta", property="product:price:amount") or \
               soup.find("meta", property="og:price:amount")
    og_currency = soup.find("meta", property="product:price:currency") or \
                  soup.find("meta", property="og:price:currency")

    if og_title:
        name = og_title.get("content", "").strip()
    if og_image:
        image_url = og_image.get("content", "").strip()
    if og_price:
        price_text = og_price.get("content", "").strip()

    # ── Strategy 2: JSON-LD structured data (Schema.org Product) ──
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
            # Handle @graph arrays
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") in ("Product", "product"):
                    if not name and item.get("name"):
                        name = str(item["name"]).strip()
                    if not image_url:
                        img = item.get("image")
                        if isinstance(img, list) and img:
                            image_url = img[0]
                        elif isinstance(img, str):
                            image_url = img
                    if not price_text:
                        offers = item.get("offers", {})
                        if isinstance(offers, list) and offers:
                            offers = offers[0]
                        if isinstance(offers, dict):
                            price_text = str(offers.get("price", ""))
                            if not og_currency and offers.get("priceCurrency"):
                                og_currency_val = offers["priceCurrency"]
        except Exception:
            pass

    # ── Strategy 3: Common CSS selectors as fallback ──
    if not name:
        for selector in [
            "h1.product-title", "h1.product-name", "h1[class*='title']",
            "h1[class*='name']", "h1[class*='product']", "h1",
            "[data-testid='product-title']", "[class*='ProductTitle']",
            # Temu specific
            "._2YkNt", "[class*='goods-title']",
        ]:
            el = soup.select_one(selector)
            if el and el.get_text(strip=True):
                name = el.get_text(strip=True)
                break

    if not price_text:
        for selector in [
            "[class*='price']:not([class*='original']):not([class*='was'])",
            "[data-testid*='price']", "[class*='Price']",
            "span.price", ".product-price", ".current-price",
            # Temu specific
            "._1k4dP", "[class*='sale-price']",
        ]:
            el = soup.select_one(selector)
            if el and el.get_text(strip=True):
                price_text = el.get_text(strip=True)
                break

    if not image_url:
        for selector in [
            "img[class*='product']", "img[class*='main']",
            ".product-image img", "#main-image", "img[data-main]",
        ]:
            el = soup.select_one(selector)
            if el and el.get("src"):
                image_url = el["src"]
                break

    # ── Strategy 4: page <title> as last resort for name ──
    if not name and soup.title:
        raw = soup.title.string or ""
        # Strip common suffixes like " | Temu" or " - Amazon"
        name = re.split(r"[|\-–—]", raw)[0].strip()

    # ── Determine currency ──
    currency_str = ""
    if og_currency:
        currency_str = og_currency.get("content", "") if hasattr(og_currency, "get") else str(og_currency)
    currency = currency_str.upper() if currency_str and len(currency_str) == 3 else \
               _detect_currency(price_text or "", domain)

    price = _extract_price(price_text) if price_text else None

    # Clean up name — remove excessive whitespace
    if name:
        name = " ".join(name.split())[:200]

    return {
        "name": name or "",
        "price": price,
        "currency": currency,
        "image_url": image_url or "",
        "url": url,
        "source_domain": domain,
    }

# ── Auth Endpoints ───────────────────────────────────────────────────

@app.post("/api/auth/register")
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
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True, # Must be True for samesite="none"
        samesite="none", # Allow cross-site cookies
        max_age=30 * 24 * 60 * 60 # 30 days
    )

    return {
        "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"]},
        # Token is no longer returned in body for security, but allowed for debug
    }

@app.post("/api/auth/login")
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
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=os.environ.get("ENV", "development") == "production",
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )

    return {
        "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"]},
    }

@app.post("/api/auth/logout")
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

@app.get("/api/auth/me")
@limiter.limit(get_limit("60/minute"))
async def get_me(request: Request, user=Depends(get_current_user)):
    return {"id": str(user["id"]), "email": user["email"], "name": user["name"], "is_admin": user.get("is_admin", False)}

# ── Password Reset Endpoints ─────────────────────────────────────────

@app.post("/api/auth/forgot-password/question")
async def get_reset_question(body: PasswordResetRequest, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT security_question FROM users WHERE email = %s", (body.email.lower(),))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User almost not found")
    if not row["security_question"]:
        raise HTTPException(status_code=400, detail="User has no security question set. Please contact admin.")
    return {"question": row["security_question"]}

@app.post("/api/auth/forgot-password/reset")
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

# ── Discovery Endpoints ──────────────────────────────────────────────

@app.get("/api/discovery")
async def get_discovery(db=Depends(get_db)):
    cur = db.cursor()
    
    # 1. Trending Items Logic
    # We count items with the same name/URL across public wishlists
    # Grouping by name and URL to identify "same" items
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

# ── Wishlist CRUD ────────────────────────────────────────────────────

@app.post("/api/wishlists")
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

@app.get("/api/wishlists")
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

@app.get("/api/wishlists/{slug}")
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
            # Owner sees everything
            item_data["reservations"] = [
                {"id": str(r["id"]), "name": r["name"], "reserved_at": r["reserved_at"].isoformat()}
                for r in reservations
            ]
            # Map legacy field for compatibility
            item_data["is_claimed"] = len(reservations) > 0
            item_data["claimed_by"] = reservations[0]["name"] if reservations else None
        else:
            # Public sees only count and initials for prompt
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
    result["like_count"] = result["like_count"]
    result["items"] = enriched_items
    return result

@app.post("/api/wishlists/{slug}/like")
async def like_wishlist(slug: str, request: Request, db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id FROM wishlists WHERE slug = %s", (slug,))
    wishlist = cur.fetchone()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    viewer_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    
    # Check if already liked
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

@app.put("/api/wishlists/{wishlist_id}")
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

@app.delete("/api/wishlists/{wishlist_id}")
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

@app.post("/api/wishlists/{slug}/clone")
async def clone_wishlist(slug: str, body: WishlistClone, user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    
    # Get original wishlist
    cur.execute("SELECT id, is_public, title FROM wishlists WHERE slug = %s", (slug,))
    original = cur.fetchone()
    if not original:
        raise HTTPException(status_code=404, detail="Original wishlist not found")
    
    if not original["is_public"]:
        raise HTTPException(status_code=403, detail="Cannot clone a private wishlist")
    
    # Create new wishlist for user
    new_wishlist_id = str(uuid.uuid4())
    new_slug = generate_slug(body.title)
    
    # Ensure slug uniqueness
    cur.execute("SELECT id FROM wishlists WHERE slug = %s", (new_slug,))
    if cur.fetchone():
        new_slug = f"{new_slug}-{secrets.token_hex(3)}"
        
    cur.execute(
        "INSERT INTO wishlists (id, user_id, title, slug, is_public) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        (new_wishlist_id, user["id"], body.title, new_slug, True)
    )
    new_wishlist = cur.fetchone()
    
    # Copy items
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

# ── Wishlist Items ───────────────────────────────────────────────────

@app.post("/api/wishlists/{wishlist_id}/items")
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

@app.put("/api/wishlists/{wishlist_id}/items/{item_id}")
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

@app.delete("/api/wishlists/{wishlist_id}/items/{item_id}")
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

# ── Claim an Item (public, no auth) ─────────────────────────────────

@app.post("/api/wishlists/{slug}/items/{item_id}/claim")
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
    
    # Update legacy field for compatibility (if needed)
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

@app.post("/api/wishlists/{slug}/items/{item_id}/unclaim")
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
    
    # Update legacy field if no more reservations
    cur.execute("SELECT COUNT(*) as count FROM item_reservations WHERE item_id = %s", (item_id,))
    rem_count = cur.fetchone()["count"]
    if rem_count == 0:
        cur.execute(
            "UPDATE wishlist_items SET is_claimed = false, claimed_by = NULL, claimed_at = NULL WHERE id = %s",
            (item_id,),
        )
    
    db.commit()
    return {"status": "unclaimed", "remaining": rem_count}

# ── View Analytics ───────────────────────────────────────────────────

@app.get("/api/wishlists/{wishlist_id}/analytics")
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

    # Views per day (last 30 days)
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

    # Unique viewers (by IP)
    cur.execute(
        "SELECT COUNT(DISTINCT viewer_ip) as unique_viewers FROM wishlist_views WHERE wishlist_id = %s",
        (wishlist_id,),
    )
    unique_viewers = cur.fetchone()["unique_viewers"]

    # Top referrers
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
# ── Admin Endpoints ──────────────────────────────────────────────────

@app.get("/api/admin/stats")
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
    
    # Growth (last 30 days vs previous 30 days)
    cur.execute("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'")
    new_users_30d = cur.fetchone()["count"]
    
    return {
        "total_users": total_users,
        "total_wishlists": total_wishlists,
        "total_views": total_views,
        "total_likes": total_likes,
        "new_users_30d": new_users_30d,
    }

@app.get("/api/admin/users")
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

@app.get("/api/admin/wishlists")
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

@app.get("/api/admin/analytics")
async def get_admin_analytics(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    
    # Views per day (last 30 days)
    cur.execute("""
        SELECT DATE(viewed_at) as date, COUNT(*) as views
        FROM wishlist_views
        WHERE viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(viewed_at)
        ORDER BY date ASC
    """)
    daily_views = [{"date": str(row["date"]), "views": row["views"]} for row in cur.fetchall()]
    
    # New wishlists per day (last 30 days)
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

@app.get("/api/admin/users/{user_id}")
async def get_admin_user_detail(user_id: str, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    
    # User Profile
    cur.execute("SELECT id, email, name, is_admin, created_at FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["id"] = str(user["id"])
    user["created_at"] = user["created_at"].isoformat()
    
    # User's Wishlists
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
    
    # User Analytics (Aggregate)
    cur.execute("SELECT COUNT(*) FROM wishlists WHERE user_id = %s", (user_id,))
    total_wishlists = cur.fetchone()["count"]
    
    cur.execute("SELECT SUM(view_count) FROM wishlists WHERE user_id = %s", (user_id,))
    total_views = cur.fetchone()["sum"] or 0
    
    # Daily views for this user's wishlists
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

@app.post("/api/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, body: AdminPasswordReset, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    # Check if user exists
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    
    new_pw_hash = hash_password(body.new_password)
    cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_pw_hash, user_id))
    db.commit()
    
    return {"message": "User password reset successfully"}

# ── Admin Promoted Items CRUD ────────────────────────────────────────

@app.get("/api/admin/promoted")
async def list_admin_promoted(admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT * FROM promoted_items ORDER BY created_at DESC")
    items = cur.fetchall()
    for i in items:
        i["id"] = str(i["id"])
        i["created_at"] = i["created_at"].isoformat()
    return items

@app.post("/api/admin/promoted")
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

@app.delete("/api/admin/promoted/{item_id}")
async def delete_promoted_item(item_id: str, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("DELETE FROM promoted_items WHERE id = %s", (item_id,))
    db.commit()
    return {"message": "Success"}

# ── Admin Promoted Wishlists CRUD ────────────────────────────────────

@app.get("/api/admin/promoted/wishlists")
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

@app.post("/api/admin/promoted/wishlists")
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

@app.delete("/api/admin/promoted/wishlists/{promoted_id}")
async def delete_promoted_wishlist(promoted_id: str, admin=Depends(get_admin_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("DELETE FROM promoted_wishlists WHERE id = %s", (promoted_id,))
    db.commit()
    return {"message": "Success"}
