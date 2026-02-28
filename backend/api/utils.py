import os
import re
import secrets
import bcrypt
from typing import Optional

def get_limit(limit_string: str) -> str:
    if os.environ.get("ENV") == "test":
        return "10000/minute"
    return limit_string

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

def detect_currency(text: str, domain: str) -> str:
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

def extract_price(text: str) -> Optional[float]:
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
