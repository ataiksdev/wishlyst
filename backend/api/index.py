import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from starlette.exceptions import HTTPException as StarletteHTTPException

load_dotenv()

from .limiter import limiter
from .routers import auth, wishlists, items, discovery, admin, scraper

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

# ── Middlewares ──────────────────────────────────────────────────────

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://wishlyst-fe-production.up.railway.app",
    "https://wishlyst.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        return Response(
            content=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            status_code=exc.status_code
        )
    
    import traceback
    print(f"ERROR: Unhandled exception in {request.url.path}")
    print(traceback.format_exc())
    return Response(
        content=f"Internal Server Error: {str(exc)}",
        status_code=500
    )

# ── Routes ───────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(discovery.router)
app.include_router(admin.router)
app.include_router(scraper.router)

# ── Health Check & Debug ─────────────────────────────────────────────

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
