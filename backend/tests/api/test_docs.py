from fastapi.testclient import TestClient


def test_serves_interactive_api_docs(client: TestClient) -> None:
    response = client.get("/docs")

    assert response.status_code == 200


def test_health_answers_under_api_prefix(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
