"""
backend/tests/api/test_admin.py — Admin Route Protection tests.

This file ensures that only users with is_admin=true can access admin routes.
"""

import pytest

class TestAdminAuthorizations:
    """Verifies that non-admin users get 403 Forbidden on admin routes."""

    @pytest.mark.smoke
    def test_admin_stats_unauthorized(self, client):
        """Unauthenticated user gets 401 Unauthorized for admin stats."""
        # Note: In FastAPI, the 401 should trigger before 403
        response = client.get("/api/admin/stats")
        assert response.status_code == 401

    def test_admin_stats_for_non_admin_user(self, auth_client):
        """Authenticated but non-admin user gets 403 Forbidden for admin stats."""
        # auth_client creates a regular user by default
        response = auth_client.get("/api/admin/stats")
        assert response.status_code == 403
        assert "admin access required" in response.json()["detail"].lower()

    def test_admin_users_for_non_admin_user(self, auth_client):
        """Regular user cannot list all users via admin-only endpoint."""
        response = auth_client.get("/api/admin/users")
        assert response.status_code == 403

    def test_admin_wishlists_for_non_admin_user(self, auth_client):
        """Regular user cannot list all wishlists via admin-only endpoint."""
        response = auth_client.get("/api/admin/wishlists")
        assert response.status_code == 403

    def test_admin_analytics_for_non_admin_user(self, auth_client):
        """Regular user cannot access global admin analytics."""
        response = auth_client.get("/api/admin/analytics")
        assert response.status_code == 403
        
    def test_admin_promote_item_for_non_admin_user(self, auth_client):
        """Regular user cannot promote items to the discovery page."""
        payload = {
            "name": "Unauthorized Promotion",
            "description": "I should not be able to do this",
            "price": 0.0,
            "currency": "USD",
            "url": "http://example.com",
            "image_url": "http://example.com/image.png"
        }
        response = auth_client.post("/api/admin/promoted", json=payload)
        assert response.status_code == 403
