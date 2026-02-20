"""
tests/api/test_health.py — Health check and utility endpoint tests.

These are the simplest tests in the suite — a good place to start
when learning. If these fail, the server isn't running.
"""

import pytest


class TestHealthCheck:
    """Tests for GET /api/health"""

    @pytest.mark.smoke
    def test_health_returns_ok(self, client):
        """
        This is the first test you should ALWAYS write.
        If this fails, no other tests will pass either — the server is down.
        """
        response = client.get("/api/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_health_response_is_fast(self, client):
        """
        Health endpoints should respond in under 500ms.
        If they don't, something is wrong with the server.
        """
        response = client.get("/api/health")

        # httpx tracks elapsed time on every response
        assert response.elapsed.total_seconds() < 5.0


class TestDiscovery:
    """Tests for GET /api/discovery — public, no auth needed"""

    @pytest.mark.smoke
    def test_discovery_returns_expected_shape(self, client):
        """Discovery endpoint returns trending, promoted, and curated sections."""
        response = client.get("/api/discovery")

        assert response.status_code == 200
        data = response.json()

        # All three sections must be present
        assert "trending" in data
        assert "promoted" in data
        assert "curated" in data

        # They should all be lists
        assert isinstance(data["trending"], list)
        assert isinstance(data["promoted"], list)
        assert isinstance(data["curated"], list)

    def test_discovery_accessible_without_auth(self, client):
        """Discovery must work for unauthenticated (logged out) users."""
        response = client.get("/api/discovery")
        assert response.status_code == 200
