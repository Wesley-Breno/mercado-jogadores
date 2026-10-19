import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, field_validator

from app.core.errors import BadRequestError, ConflictError, DomainError, NotFoundError


class ProbeBody(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_has_three_characters(cls, name: str) -> str:
        if len(name) < 3:
            raise ValueError("deve ter ao menos 3 caracteres.")
        return name


@pytest.fixture
def probe_app(app: FastAPI) -> FastAPI:
    def accept_body(body: ProbeBody) -> ProbeBody:
        return body

    def raise_domain_error(status: int) -> None:
        errors: dict[int, type[DomainError]] = {
            400: BadRequestError,
            404: NotFoundError,
            409: ConflictError,
        }
        raise errors[status]("Regra violada.")

    def crash() -> None:
        raise RuntimeError("segredo interno")

    app.add_api_route("/api/v1/probe", accept_body, methods=["POST"])
    app.add_api_route("/api/v1/probe/domain/{status}", raise_domain_error, methods=["GET"])
    app.add_api_route("/api/v1/probe/crash", crash, methods=["GET"])
    return app


@pytest.fixture
def probe_client(probe_app: FastAPI) -> TestClient:
    return TestClient(probe_app, raise_server_exceptions=False)


def assert_json_error(response, status_code: int) -> dict:
    assert response.status_code == status_code
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert isinstance(body["message"], str)
    assert body["message"]
    return body


def test_unknown_path_is_404_with_message(client: TestClient) -> None:
    assert_json_error(client.get("/api/v1/inexistente"), 404)


def test_trailing_slash_is_not_redirected(client: TestClient) -> None:
    response = client.get("/api/v1/health/", follow_redirects=False)

    assert_json_error(response, 404)


def test_method_not_allowed_has_message(client: TestClient) -> None:
    assert_json_error(client.delete("/api/v1/health"), 405)


@pytest.mark.parametrize("status_code", [400, 404, 409])
def test_domain_errors_keep_status_and_message(probe_client: TestClient, status_code: int) -> None:
    body = assert_json_error(probe_client.get(f"/api/v1/probe/domain/{status_code}"), status_code)

    assert body["message"] == "Regra violada."


def test_unexpected_error_is_500_without_stack_trace(probe_client: TestClient) -> None:
    response = probe_client.get("/api/v1/probe/crash")

    body = assert_json_error(response, 500)
    assert "segredo interno" not in response.text
    assert "Traceback" not in body["message"]


@pytest.mark.parametrize(
    "content",
    [b"{nome:", b"[]", b'"texto"', b"10", b""],
    ids=["json-invalido", "array", "texto", "numero", "vazio"],
)
def test_body_that_is_not_an_object_is_400(probe_client: TestClient, content: bytes) -> None:
    response = probe_client.post(
        "/api/v1/probe", content=content, headers={"Content-Type": "application/json"}
    )

    assert_json_error(response, 400)


def test_missing_field_is_400_naming_the_field(probe_client: TestClient) -> None:
    body = assert_json_error(probe_client.post("/api/v1/probe", json={}), 400)

    assert "name" in body["message"]


def test_custom_validation_message_reaches_the_client(probe_client: TestClient) -> None:
    body = assert_json_error(probe_client.post("/api/v1/probe", json={"name": "Jo"}), 400)

    assert "deve ter ao menos 3 caracteres." in body["message"]
