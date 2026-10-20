from functools import partial

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.openapi import build_openapi
from app.api.router import api_router
from app.core.config import Settings
from app.core.database import create_session_factory
from app.core.error_handlers import register_error_handlers
from app.core.request_logging import register_request_logging


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    app = FastAPI(
        title="Mercado de Jogadores",
        description="API do estudo de caso SENAI/PE - CÓD. 237: jogadores, clubes, mercado e liga.",
        version="1.0.0",
        redirect_slashes=False,
    )
    app.state.session_factory = create_session_factory(settings.database_url)
    register_error_handlers(app)
    register_request_logging(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.cors_origin],
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Accept"],
        expose_headers=["Location", "Content-Disposition"],
    )
    app.include_router(api_router)
    app.openapi = partial(build_openapi, app)
    return app
