"""
tests/api/test_wishlists.py — Wishlist CRUD endpoint tests.

New concepts introduced here:
  - pytest.mark.parametrize: run one test with multiple inputs
  - Testing authorization (ownership checks)
  - Testing state changes (view count increments, like count)
  - Two-user scenarios (user A can't modify user B's wishlist)
"""

import uuid
import pytest


class TestCreateWishlist:
    """Tests for POST /api/wishlists"""

    @pytest.mark.smoke
    def test_create_wishlist_success(self, auth_client):
        """Creating a wishlist returns the new wishlist with correct fields."""
        payload = {
            "title": "My Birthday List",
            "description": "Things I want for my birthday",
            "is_public": True,
        }
        response = auth_client.post("/api/wishlists", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Check all expected fields are present
        assert data["title"] == payload["title"]
        assert data["description"] == payload["description"]
        assert data["is_public"] == payload["is_public"]
        assert "id" in data
        assert "slug" in data
        assert data["slug"] != ""  # slug must be generated

    def test_create_wishlist_unauthenticated_returns_401(self, client):
        """Unauthenticated requests must be rejected."""
        response = client.post("/api/wishlists", json={"title": "Sneaky List"})
        assert response.status_code == 401

    def test_create_private_wishlist(self, auth_client):
        """is_public=False wishlists should be stored as private."""
        response = auth_client.post("/api/wishlists", json={
            "title": "Secret List",
            "is_public": False,
        })
        assert response.status_code == 200
        assert response.json()["is_public"] is False

    @pytest.mark.parametrize("title", [
        "Birthday 🎂",            # emoji in title
        "Wish & Dreams",          # special characters
        "A" * 60,                 # very long title
        "X",                      # very short title
    ])
    def test_create_wishlist_various_titles(self, auth_client, title):
        """
        LESSON: parametrize
        Instead of writing 4 separate tests, we write one and parametrize it.
        pytest will run this test once for each value in the list above.
        Each run shows up separately in the test report.
        """
        response = auth_client.post("/api/wishlists", json={"title": title})
        assert response.status_code == 200
        assert response.json()["title"] == title


class TestListWishlists:
    """Tests for GET /api/wishlists"""

    @pytest.mark.smoke
    def test_list_wishlists_returns_own_wishlists(self, auth_client, created_wishlist):
        """User should see their own wishlists in the list."""
        response = auth_client.get("/api/wishlists")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # The wishlist we just created must appear in the list
        ids = [w["id"] for w in data]
        assert created_wishlist["id"] in ids

    def test_list_wishlists_has_item_count(self, auth_client, created_item):
        """Each wishlist in the list should include an item_count field."""
        response = auth_client.get("/api/wishlists")
        assert response.status_code == 200

        wishlist_id = created_item["wishlist"]["id"]
        matching = next((w for w in response.json() if w["id"] == wishlist_id), None)

        assert matching is not None
        assert "item_count" in matching
        assert matching["item_count"] >= 1


class TestGetWishlist:
    """Tests for GET /api/wishlists/{slug}"""

    @pytest.mark.smoke
    def test_get_public_wishlist_by_slug(self, client, created_wishlist):
        """Anyone (even unauthenticated) can view a public wishlist."""
        slug = created_wishlist["slug"]
        response = client.get(f"/api/wishlists/{slug}")

        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == slug
        assert "items" in data

    def test_get_nonexistent_wishlist_returns_404(self, client):
        response = client.get("/api/wishlists/this-slug-does-not-exist-abc123")
        assert response.status_code == 404

    def test_get_private_wishlist_unauthenticated_returns_403(self, client, auth_client):
        """
        TWO-ACTOR TEST:
        1. auth_client creates a private wishlist
        2. client (unauthenticated) tries to view it → must be blocked
        """
        # Step 1: create private wishlist as logged-in user
        response = auth_client.post("/api/wishlists", json={
            "title": "My Private List",
            "is_public": False,
        })
        assert response.status_code == 200
        slug = response.json()["slug"]

        # Step 2: unauthenticated user tries to view it
        response = client.get(f"/api/wishlists/{slug}")
        assert response.status_code == 403

    def test_view_count_increments_for_non_owner(self, client, auth_client, created_wishlist):
        """
        PUBLIC VIEWER increments the view count.
        OWNER viewing does NOT increment (the API skips it for owners).
        """
        slug = created_wishlist["slug"]

        # Get initial view count via owner (doesn't increment)
        initial = auth_client.get(f"/api/wishlists/{slug}").json()["view_count"]

        # Anonymous viewer hits the endpoint
        client.get(f"/api/wishlists/{slug}")

        # Owner checks again — count should be +1
        updated = auth_client.get(f"/api/wishlists/{slug}").json()["view_count"]
        assert updated == initial + 1


class TestUpdateWishlist:
    """Tests for PUT /api/wishlists/{wishlist_id}"""

    def test_update_wishlist_title(self, auth_client, created_wishlist):
        wishlist_id = created_wishlist["id"]
        new_title = "Updated Title"

        response = auth_client.put(f"/api/wishlists/{wishlist_id}", json={"title": new_title})

        assert response.status_code == 200
        assert response.json()["title"] == new_title

    def test_update_wishlist_other_user_returns_403(self, client, base_url, created_wishlist):
        """
        OWNERSHIP TEST: User B cannot modify User A's wishlist.
        We register a second user and try to update the first user's wishlist.
        """
        import httpx

        wishlist_id = created_wishlist["id"]

        # Register and log in as a completely different user
        with httpx.Client(base_url=base_url, timeout=10.0) as other_client:
            other_client.post("/api/auth/register", json={
                "email": f"other_{uuid.uuid4().hex[:8]}@example.com",
                "password": "Pass123!",
                "name": "Other User",
            })
            response = other_client.put(
                f"/api/wishlists/{wishlist_id}",
                json={"title": "Hacked!"}
            )
            assert response.status_code == 403


class TestDeleteWishlist:
    """Tests for DELETE /api/wishlists/{wishlist_id}"""

    def test_delete_wishlist_success(self, auth_client, created_wishlist):
        wishlist_id = created_wishlist["id"]
        slug = created_wishlist["slug"]

        response = auth_client.delete(f"/api/wishlists/{wishlist_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

        # Verify it's really gone
        response = auth_client.get(f"/api/wishlists/{slug}")
        assert response.status_code == 404

    def test_delete_wishlist_unauthenticated_returns_401(self, client, created_wishlist):
        wishlist_id = created_wishlist["id"]
        response = client.delete(f"/api/wishlists/{wishlist_id}")
        assert response.status_code == 401


class TestLikeWishlist:
    """Tests for POST /api/wishlists/{slug}/like"""

    def test_like_wishlist_increments_count(self, client, created_wishlist):
        slug = created_wishlist["slug"]
        initial_likes = created_wishlist["like_count"]

        response = client.post(f"/api/wishlists/{slug}/like")

        assert response.status_code == 200
        assert response.json()["like_count"] == initial_likes + 1

    def test_double_like_returns_400(self, client, created_wishlist):
        """Same IP cannot like the same wishlist twice."""
        slug = created_wishlist["slug"]

        client.post(f"/api/wishlists/{slug}/like")  # first like
        response = client.post(f"/api/wishlists/{slug}/like")  # second like

        assert response.status_code == 400
        assert "already liked" in response.json()["detail"].lower()
