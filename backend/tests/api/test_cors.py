from fastapi.testclient import TestClient

from tests.conftest import FRONTEND_ORIGIN


def test_frontend_origin_is_allowed(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": FRONTEND_ORIGIN})

    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN


def test_preflight_from_frontend_origin_is_accepted(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN


def test_other_origins_are_not_allowed(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in response.headers
