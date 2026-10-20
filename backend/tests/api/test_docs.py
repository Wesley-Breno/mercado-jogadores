from fastapi.testclient import TestClient


def test_serves_interactive_api_docs(client: TestClient) -> None:
    response = client.get("/docs")

    assert response.status_code == 200


def test_health_answers_under_api_prefix(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_docs_list_the_error_codes_the_api_answers_and_never_422(client: TestClient) -> None:
    document = client.get("/openapi.json").json()
    operations = [operation for path in document["paths"].values() for operation in path.values()]
    buy = document["paths"]["/api/v1/players/{player_id}/buy"]["post"]["responses"]
    message_schema = buy["409"]["content"]["application/json"]["schema"]

    assert all("422" not in operation["responses"] for operation in operations)
    assert "HTTPValidationError" not in document["components"]["schemas"]
    assert sorted(buy) == ["200", "400", "404", "409"]
    assert message_schema == {"$ref": "#/components/schemas/ErrorResponse"}
    assert document["components"]["schemas"]["ErrorResponse"]["required"] == ["message"]
