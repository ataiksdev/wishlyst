import re
from urllib.parse import urlparse
import requests as http_requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, Request

from ..schemas import ScrapeRequest
from ..utils import detect_currency, extract_price, get_limit
from ..deps import get_current_user
from ..limiter import limiter

router = APIRouter(prefix="/api/scrape", tags=["Scraper"])

@router.post("")
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

    # Open Graph tags
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

    # JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
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
        except Exception:
            pass

    # Common CSS selectors
    if not name:
        for selector in [
            "h1.product-title", "h1.product-name", "h1[class*='title']",
            "h1[class*='name']", "h1[class*='product']", "h1",
            "[data-testid='product-title']", "[class*='ProductTitle']",
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

    if not name and soup.title:
        raw = soup.title.string or ""
        name = re.split(r"[|\-–—]", raw)[0].strip()

    currency_str = ""
    if og_currency:
        currency_str = og_currency.get("content", "") if hasattr(og_currency, "get") else str(og_currency)
    currency = currency_str.upper() if currency_str and len(currency_str) == 3 else \
               detect_currency(price_text or "", domain)

    price = extract_price(price_text) if price_text else None

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
