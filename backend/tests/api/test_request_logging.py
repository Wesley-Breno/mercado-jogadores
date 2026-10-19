import logging

import pytest
from fastapi.testclient import TestClient


def test_each_request_produces_one_log_line(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO, logger="app.requests")

    client.get("/api/v1/inexistente")

    lines = [record.getMessage() for record in caplog.records if record.name == "app.requests"]
    assert lines == ["GET /api/v1/inexistente 404"]
