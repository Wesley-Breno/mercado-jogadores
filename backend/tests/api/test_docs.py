from fastapi.testclient import TestClient

from app.main import create_app


def test_serves_interactive_api_docs() -> None:
    client = TestClient(create_app())

    response = client.get("/docs")

    assert response.status_code == 200
