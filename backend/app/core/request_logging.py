import logging
import sys
import time
from collections.abc import Awaitable, Callable
from datetime import datetime

from fastapi import FastAPI, Request, Response

from app.core.clock import BRASILIA_TZ

request_logger = logging.getLogger("app.requests")


def brasilia_time(seconds: float | None) -> time.struct_time:
    return datetime.fromtimestamp(seconds or time.time(), BRASILIA_TZ).timetuple()


def configure_logging() -> None:
    app_logger = logging.getLogger("app")
    if app_logger.handlers:
        return
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s", "%Y-%m-%d %H:%M:%S")
    formatter.converter = brasilia_time
    handler.setFormatter(formatter)
    app_logger.addHandler(handler)
    app_logger.setLevel(logging.INFO)


async def log_request(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    request_logger.info("%s %s %s", request.method, request.url.path, response.status_code)
    return response


def register_request_logging(app: FastAPI) -> None:
    configure_logging()
    app.middleware("http")(log_request)
