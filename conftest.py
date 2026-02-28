"""
conftest.py — Shared fixtures for the Wishlyst test suite.

This file is automatically loaded by pytest before any test runs.
Fixtures defined here are available to ALL tests without importing.

Key concepts demonstrated:
  - pytest fixtures (the @pytest.fixture decorator)
  - Fixture scope (function, module, session)
  - Fixture dependency (fixtures can use other fixtures)
  - yield fixtures (setup → test → teardown)
"""

import os
import pytest
import httpx
import uuid
from dotenv import load_dotenv

# Load .env file to ensure DATABASE_URL and other settings are available to tests
load_dotenv()

os.environ["ENV"] = "test"

# ── Configuration ────────────────────────────────────────────────────
# The base URL of your running FastAPI server.
# Override via environment variable: BASE_URL=http://staging.example.com pytest

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def pytest_addoption(parser):
    """Add custom command line options to pytest."""
    parser.addoption(
        "--no-cleanup", action="store_true", default=False, help="Skip automatic cleanup of test data at the end of the session"
    )


# ── Helper: generate unique test data ────────────────────────────────
def unique_email():
    """Each test run gets a unique email so tests don't collide."""
    return f"test_{uuid.uuid4().hex[:8]}@wishlyst-test.com"


def unique_name():
    return f"Test User {uuid.uuid4().hex[:6]}"


# ── Core Fixtures ─────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def base_url():
    """
    SCOPE: session — created once for the entire test run.
    Use for things that never change: config, URLs, constants.
    """
    return BASE_URL


@pytest.fixture
def client(base_url):
    """
    SCOPE: function (default) — a fresh HTTP client for every test.

    httpx.Client() works like the requests library but also supports
    cookies automatically (important for session_token auth).

    The 'with' block ensures the connection is properly closed after
    each test, even if the test fails.
    """
    with httpx.Client(base_url=base_url, timeout=10.0) as client:
        yield client
    # ↑ Everything before yield = setup. Everything after = teardown.


@pytest.fixture
def registered_user(base_url):
    """
    SCOPE: function — registers a brand-new user for each test that needs one.
    Uses a private client to avoid poisoning the shared 'client' fixture.
    """
    credentials = {
        "email": unique_email(),
        "password": "TestPass123!",
        "name": unique_name(),
        "security_question": "What is your pet's name?",
        "security_answer": "fluffy",
    }
    # Use a private client that doesn't share cookies with the rest of the session
    with httpx.Client(base_url=base_url, timeout=10.0) as setup_client:
        response = setup_client.post("/api/auth/register", json=credentials)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        user_data = response.json()["user"]
        return {**user_data, "credentials": credentials, "cookies": dict(setup_client.cookies)}


@pytest.fixture
def auth_client(base_url, registered_user):
    """
    SCOPE: function — an HTTP client that is already logged in.
    """
    client = httpx.Client(base_url=base_url, timeout=10.0)
    # Login to get a fresh session cookie
    response = client.post("/api/auth/login", json={
        "email": registered_user["credentials"]["email"],
        "password": registered_user["credentials"]["password"],
    })
    assert response.status_code == 200, f"Auth client login failed: {response.text}"
    yield client
    client.close()


@pytest.fixture
def created_wishlist(auth_client):
    """
    SCOPE: function — creates a wishlist and returns it.
    """
    payload = {
        "title": f"Test Wishlist {uuid.uuid4().hex[:6]}",
        "description": "Created by automated test",
        "is_public": True,
    }
    response = auth_client.post("/api/wishlists", json=payload)
    assert response.status_code == 200, f"Wishlist creation failed: {response.text}"
    return response.json()


@pytest.fixture
def created_item(auth_client, created_wishlist):
    """
    SCOPE: function — adds an item to an existing wishlist and returns it.
    """
    wishlist_id = created_wishlist["id"]
    payload = {
        "name": "Test Item",
        "price": 29.99,
        "currency": "USD",
        "tag": "electronics",
        "url": "https://example.com/product",
    }
    response = auth_client.post(f"/api/wishlists/{wishlist_id}/items", json=payload)
    assert response.status_code == 200, f"Item creation failed: {response.text}"
    return {**response.json(), "wishlist": created_wishlist}


# ── Cleanup Logic ───────────────────────────────────────────────────

def pytest_sessionfinish(session, exitstatus):
    """
    Called after all tests have finished.
    Automatically wipes all test data from the database unless --no-cleanup is passed.
    """
    # Check if cleanup was explicitly disabled via command line
    if session.config.getoption("--no-cleanup"):
        print("\n\n[Cleanup] Skipped (--no-cleanup flag detected).")
        return

    import os
    import psycopg2
    
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("\n\n[Cleanup] Skipped (DATABASE_URL not found in environment).")
        return
        
    print("\n\n[Cleanup] Removing all test data (@wishlyst-test.com)...")
    try:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Identify users created during testing (using the unique domain)
        cur.execute("SELECT id FROM users WHERE email LIKE '%@wishlyst-test.com'")
        test_user_ids = [str(r[0]) for r in cur.fetchall()]
        
        if test_user_ids:
            ids_placeholder = ', '.join(['%s'] * len(test_user_ids))
            
            # Use separate deletes for safety across different DB schemas
            cur.execute(f"DELETE FROM item_reservations WHERE item_id IN (SELECT id FROM wishlist_items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id IN ({ids_placeholder})))", test_user_ids)
            cur.execute(f"DELETE FROM wishlist_items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id IN ({ids_placeholder}))", test_user_ids)
            cur.execute(f"DELETE FROM wishlist_likes WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id IN ({ids_placeholder}))", test_user_ids)
            cur.execute(f"DELETE FROM wishlist_views WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id IN ({ids_placeholder}))", test_user_ids)
            cur.execute(f"DELETE FROM sessions WHERE user_id IN ({ids_placeholder})", test_user_ids)
            cur.execute(f"DELETE FROM wishlists WHERE user_id IN ({ids_placeholder})", test_user_ids)
            cur.execute(f"DELETE FROM users WHERE id IN ({ids_placeholder})", test_user_ids)
            
            conn.commit()
            print(f"  Successfully cleaned up {len(test_user_ids)} test users.")
        else:
            print("  No test data found to clean.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"  Cleanup failed: {e}")
