from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

_VALIDATION_SCHEMAS = ("HTTPValidationError", "ValidationError")


def build_openapi(app: FastAPI) -> dict[str, Any]:
    """FastAPI documents a 422 on every route with input, but this API answers it with 400."""
    if app.openapi_schema is None:
        schema = get_openapi(
            title=app.title, version=app.version, description=app.description, routes=app.routes
        )
        for operations in schema["paths"].values():
            for operation in operations.values():
                operation["responses"].pop("422", None)
        components = schema.get("components", {}).get("schemas", {})
        for name in _VALIDATION_SCHEMAS:
            components.pop(name, None)
        app.openapi_schema = schema
    return app.openapi_schema
