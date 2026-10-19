import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

FRONTEND_ORIGIN = "http://localhost:5173"


@pytest.fixture
def settings() -> Settings:
    return Settings(cors_origin=FRONTEND_ORIGIN)


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app, raise_server_exceptions=False)
