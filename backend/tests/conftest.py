import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Connection, Engine, create_engine, make_url, text

from app.core.config import Settings
from app.main import create_app

FRONTEND_ORIGIN = "http://localhost:5173"
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://mercado:mercado@localhost:5432/mercado_test"
)
BACKEND_DIR = Path(__file__).resolve().parents[1]
TABLES = (
    "duelos_partida",
    "partidas",
    "escalacoes",
    "transacoes",
    "contratos",
    "jogadores",
    "clubes",
)


def ensure_database_exists(url: str) -> None:
    target = make_url(url)
    admin_engine = create_engine(target.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        exists = connection.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": target.database}
        )
        if not exists:
            quoted_name = connection.dialect.identifier_preparer.quote(target.database)
            connection.execute(text(f"CREATE DATABASE {quoted_name}"))
    admin_engine.dispose()


def alembic_config(url: str) -> Config:
    config = Config(BACKEND_DIR / "alembic.ini")
    config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))
    config.attributes["configure_logger"] = False
    return config


@pytest.fixture(scope="session")
def database_url() -> str:
    ensure_database_exists(TEST_DATABASE_URL)
    config = alembic_config(TEST_DATABASE_URL)
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    return TEST_DATABASE_URL


@pytest.fixture(scope="session")
def engine(database_url: str) -> Iterator[Engine]:
    engine = create_engine(database_url)
    yield engine
    engine.dispose()


@pytest.fixture
def clean_database(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE {', '.join(TABLES)} RESTART IDENTITY CASCADE"))


@pytest.fixture
def connection(engine: Engine, clean_database: None) -> Iterator[Connection]:
    with engine.connect() as connection:
        transaction = connection.begin()
        yield connection
        transaction.rollback()


def count_rows(engine: Engine, table: str) -> int:
    with engine.connect() as connection:
        return connection.scalar(text(f"SELECT count(*) FROM {table}"))


@pytest.fixture
def settings(database_url: str) -> Settings:
    return Settings(cors_origin=FRONTEND_ORIGIN, database_url=database_url)


@pytest.fixture
def app(settings: Settings, clean_database: None) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app, raise_server_exceptions=False)
