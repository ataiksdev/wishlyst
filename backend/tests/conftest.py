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
os.environ["ENV"] = "test"

import pytest
import httpx
import uuid

# ── Configuration ────────────────────────────────────────────────────
# The base URL of your running FastAPI server.
# Override via environment variable: BASE_URL=http://staging.example.com pytest
import os

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


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
def registered_user(client):
    """
    SCOPE: function — registers a brand-new user for each test that needs one.

    This is an example of a 'factory fixture' — it creates real data
    in your database so your test can work with it.

    Returns a dict with user info AND the credentials used to create it,
    so tests can log in again if needed.
    """
    credentials = {
        "email": unique_email(),
        "password": "TestPass123!",
        "name": unique_name(),
        "security_question": "What is your pet's name?",
        "security_answer": "fluffy",
    }
    response = client.post("/api/auth/register", json=credentials)
    assert response.status_code == 200, f"Registration failed: {response.text}"

    user_data = response.json()["user"]
    # Merge credentials into the returned dict so tests have everything they need
    return {**user_data, "credentials": credentials, "cookies": dict(client.cookies)}


@pytest.fixture
def auth_client(base_url, registered_user):
    """
    SCOPE: function — an HTTP client that is already logged in.

    This is the fixture you'll use for any test that requires authentication.
    It reuses the session cookie from registration (you're auto-logged-in
    after registering in this API).

    Usage in a test:
        def test_something(auth_client):
            response = auth_client.get("/api/wishlists")
            assert response.status_code == 200
    """
    with httpx.Client(base_url=base_url, timeout=10.0) as client:
        # Replay the login to get a fresh session cookie
        client.post("/api/auth/login", json={
            "email": registered_user["credentials"]["email"],
            "password": registered_user["credentials"]["password"],
        })
        yield client


@pytest.fixture
def created_wishlist(auth_client):
    """
    SCOPE: function — creates a wishlist and returns it.

    A great example of fixture chaining: this fixture depends on
    auth_client, which depends on registered_user, which depends on client.
    Pytest resolves the whole chain automatically.

    Tests that need a wishlist already in place just use this fixture
    instead of creating one themselves.
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

    Demonstrates deep fixture chaining: item → wishlist → auth_client → user → client
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