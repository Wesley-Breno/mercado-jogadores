from collections.abc import Callable
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine

from tests.api.test_clubs import NOW
from tests.api.test_matches import AGUIAS_STARTERS, DELTA_STARTERS, build_team
from tests.api.test_players_create import PLAYERS_URL


@pytest.fixture
def league(client: TestClient, engine: Engine, freeze_clock: Callable[[datetime], None]) -> dict:
    freeze_clock(NOW)
    aguias = build_team(client, engine, "Águias FC", "AGU", AGUIAS_STARTERS, "2-1-1")
    delta = build_team(client, engine, "Delta FC", "DFC", DELTA_STARTERS, "2-1-1")
    client.patch(
        f"{PLAYERS_URL}/{aguias['players']['Davi Lins']}/condition",
        json={"condition": "MAL_CONDICIONADO"},
    )
    return {"aguias": aguias, "delta": delta}
