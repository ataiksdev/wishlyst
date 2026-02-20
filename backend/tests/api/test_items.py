"""
tests/api/test_items.py — Wishlist item and claiming/unclaiming tests.

New concepts introduced here:
  - Testing a multi-step user flow (claim → verify → unclaim → verify)
  - Asserting on response body structure for different user roles
    (owner sees full claim details; public sees only initials)
"""

import pytest


class TestAddItem:
    """Tests for POST /api/wishlists/{wishlist_id}/items"""

    @pytest.mark.smoke
    def test_add_item_success(self, auth_client, created_wishlist):
        """Owner can add an item to their wishlist."""
        wishlist_id = created_wishlist["id"]
        payload = {
            "name": "Sony WH-1000XM5 Headphones",
            "price": 349.99,
            "currency": "USD",
            "tag": "electronics",
            "url": "https://amazon.com/example",
        }

        response = auth_client.post(f"/api/wishlists/{wishlist_id}/items", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["price"] == payload["price"]
        assert data["currency"] == payload["currency"]
        assert "id" in data

    def test_add_item_minimal_fields(self, auth_client, created_wishlist):
        """Only 'name' is required. Other fields are optional."""
        wishlist_id = created_wishlist["id"]
        response = auth_client.post(
            f"/api/wishlists/{wishlist_id}/items",
            json={"name": "Just a name"}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Just a name"

    def test_add_item_unauthenticated_returns_401(self, client, created_wishlist):
        wishlist_id = created_wishlist["id"]
        response = client.post(
            f"/api/wishlists/{wishlist_id}/items",
            json={"name": "Sneaky item"}
        )
        assert response.status_code == 401

    def test_add_item_to_wrong_wishlist_returns_403(self, client, base_url, created_wishlist):
        """User B cannot add items to User A's wishlist."""
        import httpx, uuid

        wishlist_id = created_wishlist["id"]
        with httpx.Client(base_url=base_url, timeout=10.0) as other_client:
            other_client.post("/api/auth/register", json={
                "email": f"other_{uuid.uuid4().hex[:8]}@example.com",
                "password": "Pass123!",
                "name": "Other User",
            })
            response = other_client.post(
                f"/api/wishlists/{wishlist_id}/items",
                json={"name": "Unauthorized item"}
            )
            assert response.status_code == 403


class TestUpdateItem:
    """Tests for PUT /api/wishlists/{wishlist_id}/items/{item_id}"""

    def test_update_item_price(self, auth_client, created_item):
        wishlist_id = created_item["wishlist"]["id"]
        item_id = created_item["id"]

        response = auth_client.put(
            f"/api/wishlists/{wishlist_id}/items/{item_id}",
            json={"price": 199.99}
        )

        assert response.status_code == 200
        assert response.json()["price"] == 199.99

    def test_update_item_name(self, auth_client, created_item):
        wishlist_id = created_item["wishlist"]["id"]
        item_id = created_item["id"]

        response = auth_client.put(
            f"/api/wishlists/{wishlist_id}/items/{item_id}",
            json={"name": "Renamed Item"}
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Renamed Item"


class TestDeleteItem:
    """Tests for DELETE /api/wishlists/{wishlist_id}/items/{item_id}"""

    def test_delete_item_success(self, auth_client, created_item):
        wishlist_id = created_item["wishlist"]["id"]
        item_id = created_item["id"]
        slug = created_item["wishlist"]["slug"]

        response = auth_client.delete(f"/api/wishlists/{wishlist_id}/items/{item_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

        # Verify item is gone from the wishlist
        wishlist = auth_client.get(f"/api/wishlists/{slug}").json()
        item_ids = [i["id"] for i in wishlist["items"]]
        assert item_id not in item_ids


class TestClaimItem:
    """
    Tests for POST /api/wishlists/{slug}/items/{item_id}/claim
    and           POST /api/wishlists/{slug}/items/{item_id}/unclaim

    This is one of Wishlyst's most unique features:
    Friends can "claim" items to signal they'll be buying them.
    No login required — just provide your name.
    """

    @pytest.mark.smoke
    def test_claim_item_success(self, client, created_item):
        """Public user can claim an item with just their name."""
        slug = created_item["wishlist"]["slug"]
        item_id = created_item["id"]

        response = client.post(
            f"/api/wishlists/{slug}/items/{item_id}/claim",
            json={"name": "Alice"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Alice"
        assert "id" in data
        assert "reserved_at" in data

    def test_claimed_item_shows_as_claimed_to_public(self, client, created_item):
        """
        After claiming, the public view of the wishlist must show
        the item as claimed. Public users only see initials, not the full name.
        """
        slug = created_item["wishlist"]["slug"]
        item_id = created_item["id"]

        # Claim it
        client.post(
            f"/api/wishlists/{slug}/items/{item_id}/claim",
            json={"name": "Bob Smith"}
        )

        # Fetch the wishlist as a public viewer
        wishlist = client.get(f"/api/wishlists/{slug}").json()
        item = next(i for i in wishlist["items"] if i["id"] == item_id)

        assert item["is_claimed"] is True
        # Public should see initials only ("BS"), not the full name
        assert "reserver_initials" in item
        assert "BS" in item["reserver_initials"]
        # Full name must NOT be exposed to the public
        assert "claimed_by" not in item or item.get("claimed_by") is None

    def test_claimed_item_shows_full_details_to_owner(self, auth_client, created_item):
        """
        Owner gets the full reservation details including the claimer's name.
        This is a role-based response test — same endpoint, different output.
        """
        slug = created_item["wishlist"]["slug"]
        item_id = created_item["id"]

        # A friend claims it (no auth needed)
        import httpx
        with httpx.Client(base_url=auth_client.base_url, timeout=10.0) as public:
            public.post(
                f"/api/wishlists/{slug}/items/{item_id}/claim",
                json={"name": "Charlie Brown"}
            )

        # Owner fetches their wishlist
        wishlist = auth_client.get(f"/api/wishlists/{slug}").json()
        item = next(i for i in wishlist["items"] if i["id"] == item_id)

        assert item["is_claimed"] is True
        # Owner should see the full reservations list
        assert "reservations" in item
        names = [r["name"] for r in item["reservations"]]
        assert "Charlie Brown" in names

    def test_unclaim_item_success(self, client, created_item):
        """
        FULL FLOW TEST: claim → verify claimed → unclaim → verify unclaimed.
        This tests a complete user journey in one test.
        """
        slug = created_item["wishlist"]["slug"]
        item_id = created_item["id"]

        # Step 1: Claim
        client.post(
            f"/api/wishlists/{slug}/items/{item_id}/claim",
            json={"name": "Diana"}
        )

        # Step 2: Verify it's claimed
        wishlist = client.get(f"/api/wishlists/{slug}").json()
        item = next(i for i in wishlist["items"] if i["id"] == item_id)
        assert item["is_claimed"] is True

        # Step 3: Unclaim
        response = client.post(
            f"/api/wishlists/{slug}/items/{item_id}/unclaim",
            json={"name": "Diana"}
        )
        assert response.status_code == 200

        # Step 4: Verify it's no longer claimed
        wishlist = client.get(f"/api/wishlists/{slug}").json()
        item = next(i for i in wishlist["items"] if i["id"] == item_id)
        assert item["is_claimed"] is False

    def test_multiple_people_can_claim_same_item(self, client, created_item):
        """
        Unlike a typical reservation system, Wishlyst allows multiple
        people to "contribute" to the same item. Test that this works.
        """
        slug = created_item["wishlist"]["slug"]
        item_id = created_item["id"]

        client.post(
            f"/api/wishlists/{slug}/items/{item_id}/claim",
            json={"name": "Person One"}
        )
        client.post(
            f"/api/wishlists/{slug}/items/{item_id}/claim",
            json={"name": "Person Two"}
        )

        wishlist = client.get(f"/api/wishlists/{slug}").json()
        item = next(i for i in wishlist["items"] if i["id"] == item_id)

        assert item["reservations_count"] == 2
