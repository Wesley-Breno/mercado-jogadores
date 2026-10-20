"""Helpers of the conformance suite: plain HTTP against the running API, as the grading script."""

from datetime import datetime, timedelta

import httpx2

from app.core.clock import BRASILIA_TZ

MEIA_LUA = {
    "name": "Meia Lua",
    "position": "MEI",
    "agility": 85,
    "age": 25,
    "pace": 70,
    "shooting": 68,
    "passing": 82,
    "dribbling": 79,
    "defending": 55,
    "physical": 64,
    "potential": 86,
}


def create_player(api: httpx2.Client, **changes: object) -> dict:
    response = api.post("/players", json={**MEIA_LUA, **changes})
    assert response.status_code == 201, response.text
    return response.json()


def cheap_player(api: httpx2.Client, name: str, position: str = "MEI") -> dict:
    """A player worth a few coins, to fill squads without hitting the 50% cash limit."""
    attributes = dict.fromkeys(
        ("pace", "shooting", "passing", "dribbling", "defending", "physical"), 45
    )
    return create_player(api, name=name, position=position, agility=50, potential=50, **attributes)


def create_club(api: httpx2.Client, name: str, acronym: str) -> dict:
    response = api.post("/clubs", json={"name": name, "acronym": acronym})
    assert response.status_code == 201, response.text
    return response.json()


def loyalty_in(days: float) -> str:
    """RN01: the end of loyalty `days` from now, in Brasília time, with -03:00."""
    moment = datetime.now(BRASILIA_TZ) + timedelta(days=days)
    return moment.strftime("%Y-%m-%dT%H:%M-03:00")


def buy(api: httpx2.Client, player_id: int, club_id: int, days: float = 120) -> httpx2.Response:
    return api.post(
        f"/players/{player_id}/buy", json={"club_id": club_id, "loyalty_until": loyalty_in(days)}
    )


def bought(api: httpx2.Client, player_id: int, club_id: int, days: float = 120) -> dict:
    response = buy(api, player_id, club_id, days)
    assert response.status_code == 200, response.text
    return response.json()


def club(api: httpx2.Client, club_id: int) -> dict:
    return api.get(f"/clubs/{club_id}").json()
