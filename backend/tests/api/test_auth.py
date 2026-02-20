"""
tests/api/test_auth.py — Authentication endpoint tests.

What you'll learn in this file:
  - How to structure a test file with classes (grouping related tests)
  - Positive tests (happy path)
  - Negative tests (error cases / edge cases)
  - How to use fixtures
  - pytest.mark for tagging tests
  - Asserting response status codes AND response body shape
"""

import uuid
import pytest


# ─────────────────────────────────────────────────────────────────────
# LESSON: Test Classes
# Grouping tests inside a class is optional but highly recommended.
# It keeps related tests together and makes the output readable.
# Class names MUST start with "Test" for pytest to pick them up.
# ─────────────────────────────────────────────────────────────────────

class TestRegistration:
    """Tests for POST /api/auth/register"""

    @pytest.mark.smoke
    def test_register_success(self, client):
        """
        SMOKE TEST — the most critical path. If this fails, nothing works.

        A well-written test has three parts (AAA pattern):
          Arrange → set up your data
          Act     → call the API
          Assert  → verify the result
        """
        # Arrange
        payload = {
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "SecurePass123!",
            "name": "Jane Doe",
            "security_question": "Pet name?",
            "security_answer": "Fluffy",
        }

        # Act
        response = client.post("/api/auth/register", json=payload)

        # Assert — check status code first
        assert response.status_code == 200

        # Assert — check the response body shape
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["name"] == payload["name"]
        # Paranoia check: password should NEVER appear in a response
        assert "password" not in data["user"]

        # Assert — a session cookie should have been set
        assert "session_token" in response.cookies

    def test_register_duplicate_email_returns_409(self, client, registered_user):
        """
        NEGATIVE TEST — the API should reject a duplicate email.

        We use the registered_user fixture which already created a user.
        Now we try to register again with the same email.
        """
        payload = {
            "email": registered_user["credentials"]["email"],  # same email!
            "password": "AnotherPass123!",
            "name": "Duplicate User",
        }
        response = client.post("/api/auth/register", json=payload)

        assert response.status_code == 409
        assert "already registered" in response.json()["detail"].lower()

    def test_register_missing_required_fields_returns_422(self, client):
        """
        LESSON: 422 Unprocessable Entity is FastAPI's validation error.
        It fires before your code even runs — Pydantic catches it.
        """
        # Missing 'name' and 'password'
        response = client.post("/api/auth/register", json={"email": "incomplete@example.com"})
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/auth/login"""

    @pytest.mark.smoke
    def test_login_success(self, client, registered_user):
        """
        Happy path: valid credentials → 200 + cookie.
        We use registered_user so we know the credentials are valid.
        """
        response = client.post("/api/auth/login", json={
            "email": registered_user["credentials"]["email"],
            "password": registered_user["credentials"]["password"],
        })

        assert response.status_code == 200
        assert "session_token" in response.cookies
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == registered_user["credentials"]["email"]

    def test_login_wrong_password_returns_401(self, client, registered_user):
        response = client.post("/api/auth/login", json={
            "email": registered_user["credentials"]["email"],
            "password": "WrongPassword!",
        })
        assert response.status_code == 401

    def test_login_nonexistent_email_returns_401(self, client):
        response = client.post("/api/auth/login", json={
            "email": "doesnotexist@example.com",
            "password": "SomePassword!",
        })
        assert response.status_code == 401


class TestCurrentUser:
    """Tests for GET /api/auth/me"""

    @pytest.mark.smoke
    def test_get_me_authenticated(self, auth_client, registered_user):
        """Authenticated user can fetch their own profile."""
        response = auth_client.get("/api/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user["credentials"]["email"]
        assert data["name"] == registered_user["credentials"]["name"]
        assert "is_admin" in data

    def test_get_me_unauthenticated_returns_401(self, client):
        """No cookie → must be rejected."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401


class TestLogout:
    """Tests for POST /api/auth/logout"""

    def test_logout_clears_session(self, auth_client):
        """
        After logout, the same client should no longer be authenticated.
        This tests a real-world user flow end-to-end.
        """
        # Verify we're logged in
        assert auth_client.get("/api/auth/me").status_code == 200

        # Act: log out
        response = auth_client.post("/api/auth/logout")
        assert response.status_code == 200

        # Assert: same client is now unauthenticated
        response_after = auth_client.get("/api/auth/me")
        assert response_after.status_code == 401
