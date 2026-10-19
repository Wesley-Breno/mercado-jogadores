import logging
from collections.abc import Awaitable, Callable
from http import HTTPStatus

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.core.errors import DomainError

logger = logging.getLogger("app.errors")

INTERNAL_ERROR_MESSAGE = "Erro interno. A operação não foi concluída."
HTTP_STATUS_MESSAGES = {
    HTTPStatus.NOT_FOUND: "Recurso não encontrado.",
    HTTPStatus.METHOD_NOT_ALLOWED: "Método não permitido para este recurso.",
}
BODY_SHAPE_ERRORS = {"model_attributes_type", "dict_type", "model_type"}


def error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"message": message})


def describe_validation_error(error: dict) -> str:
    location = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
    field = ".".join(location)
    error_type = error["type"]
    context = error.get("ctx", {})
    if error_type == "json_invalid":
        return "O corpo da requisição não é um JSON válido."
    if not field and (error_type in BODY_SHAPE_ERRORS or error_type == "missing"):
        return "O corpo da requisição deve ser um objeto JSON."
    if error_type == "missing":
        return f"O campo '{field}' é obrigatório."
    if error_type == "value_error":
        detail = str(context["error"])
        return f"Campo '{field}': {detail}" if field else detail
    if error_type == "greater_than_equal":
        return f"Campo '{field}': deve ser no mínimo {context['ge']}."
    if error_type == "less_than_equal":
        return f"Campo '{field}': deve ser no máximo {context['le']}."
    if error_type == "enum":
        accepted = str(context["expected"]).replace(" or ", " ou ")
        return f"Campo '{field}': valor fora da lista aceita ({accepted})."
    if error_type == "string_type":
        return f"Campo '{field}': deve ser um texto."
    return f"O campo '{field}' é inválido."


async def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
    return error_response(error.status_code, error.message)


async def handle_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
    return error_response(HTTPStatus.BAD_REQUEST, describe_validation_error(error.errors()[0]))


async def handle_http_error(_: Request, error: HTTPException) -> JSONResponse:
    message = HTTP_STATUS_MESSAGES.get(error.status_code, str(error.detail))
    return error_response(error.status_code, message)


async def catch_unhandled_errors(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
        return error_response(HTTPStatus.INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, handle_domain_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(HTTPException, handle_http_error)
    app.middleware("http")(catch_unhandled_errors)
