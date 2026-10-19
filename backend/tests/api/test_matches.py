from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response
from sqlalchemy import Engine

from tests.api.test_clubs import CLUBS_URL, NOW, create_club, create_player, set_cash
from tests.api.test_market_buy import LOYALTY_UNTIL, buy
from tests.api.test_market_sell import sell
from tests.api.test_players_create import PLAYERS_URL
from tests.conftest import count_rows

MATCHES_URL = "/api/v1/matches"
Freeze = Callable[[datetime], None]

# Starters of the RN20 example; the other attributes come from MEIA_LUA (70, 68, 82, 79, 55, 64).
AGUIAS_STARTERS = {
    "Rui Prado": {"position": "GOL", "defending": 77},
    "Téo Brandão": {"position": "ZAG", "defending": 84},
    "Davi Lins": {"position": "LAT", "dribbling": 74, "defending": 66},
    "Lauro Neves": {"position": "MEI", "passing": 82},
    "Otto Rangel": {"position": "ATA", "shooting": 75},
}
DELTA_STARTERS = {
    "Ivo Teles": {"position": "GOL", "defending": 72},
    "Hugo Vaz": {"position": "ZAG", "defending": 84},
    "Lino Matos": {"position": "LAT", "dribbling": 79, "defending": 63},
    "Nei Soares": {"position": "MEI", "passing": 70},
    "Ugo Falcão": {"position": "ATA", "shooting": 81},
}

THIRD_TEAM_STARTERS = {
    "Gael Goleiro": {"position": "GOL"},
    "Zico Zagueiro": {"position": "ZAG"},
    "Leo Lateral": {"position": "LAT"},
    "Mano Meia": {"position": "MEI"},
    "Alan Atacante": {"position": "ATA"},
}


def build_team(
    client: TestClient, engine: Engine, name: str, acronym: str, starters: dict, formation: str
) -> dict:
    club_id = create_club(client, name, acronym)
    set_cash(engine, club_id, "99999.00")
    ids = {}
    for player_name, changes in starters.items():
        ids[player_name] = create_player(client, name=player_name, **changes)
        buy(client, ids[player_name], {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    response = client.put(
        f"{CLUBS_URL}/{club_id}/lineup",
        json={"formation": formation, "player_ids": list(ids.values())},
    )
    assert response.status_code == 200, response.json()
    return {"id": club_id, "players": ids}


@pytest.fixture
def league(client: TestClient, engine: Engine, freeze_clock: Freeze) -> dict:
    freeze_clock(NOW)
    aguias = build_team(client, engine, "Águias FC", "AGU", AGUIAS_STARTERS, "2-1-1")
    delta = build_team(client, engine, "Delta FC", "DFC", DELTA_STARTERS, "2-1-1")
    client.patch(
        f"{PLAYERS_URL}/{aguias['players']['Davi Lins']}/condition",
        json={"condition": "MAL_CONDICIONADO"},
    )
    return {"aguias": aguias, "delta": delta}


def play(client: TestClient, home: int, away: int) -> Response:
    return client.post(MATCHES_URL, json={"home_club_id": home, "away_club_id": away})


def test_example_of_the_statement(client: TestClient, league: dict, freeze_clock: Freeze) -> None:
    freeze_clock(NOW + timedelta(days=10))
    aguias, delta = league["aguias"], league["delta"]

    response = play(client, aguias["id"], delta["id"])

    assert response.status_code == 201
    assert response.headers["location"] == "/api/v1/matches/1"
    body = response.json()
    assert body["played_at"] == "2026-11-12T10:15:00-03:00"
    assert body["home"] == {
        "club_id": aguias["id"],
        "club_name": "Águias FC",
        "formation": "2-1-1",
        "goals": 1,
    }
    assert body["away"] == {
        "club_id": delta["id"],
        "club_name": "Delta FC",
        "formation": "2-1-1",
        "goals": 2,
    }
    assert body["result"] == "VISITANTE"
    assert body["duels"][0] == {
        "order": 1,
        "attacking_club_id": aguias["id"],
        "attacker": {
            "player_id": aguias["players"]["Otto Rangel"],
            "player_name": "Otto Rangel",
            "position": "ATA",
            "condition": "APTO",
            "attribute": "shooting",
            "value": 75,
        },
        "defender": {
            "player_id": delta["players"]["Ivo Teles"],
            "player_name": "Ivo Teles",
            "position": "GOL",
            "condition": "APTO",
            "attribute": "defending",
            "value": 72,
        },
        "goal": True,
    }
    assert [
        (
            duel["order"],
            duel["attacker"]["player_name"],
            duel["attacker"]["attribute"],
            duel["attacker"]["value"],
            duel["defender"]["player_name"],
            duel["defender"]["value"],
            duel["goal"],
        )
        for duel in body["duels"]
    ] == [
        (1, "Otto Rangel", "shooting", 75, "Ivo Teles", 72, True),
        (2, "Lauro Neves", "passing", 82, "Hugo Vaz", 84, False),
        (3, "Davi Lins", "dribbling", 63, "Lino Matos", 63, False),
        (4, "Ugo Falcão", "shooting", 81, "Rui Prado", 77, True),
        (5, "Nei Soares", "passing", 70, "Téo Brandão", 84, False),
        (6, "Lino Matos", "dribbling", 79, "Davi Lins", 56, True),
    ]
    assert body["duels"][2]["attacker"]["condition"] == "MAL_CONDICIONADO"
    assert client.get(f"{MATCHES_URL}/1").json() == body


def test_match_changes_no_cash_lineup_or_player(client: TestClient, league: dict) -> None:
    aguias = league["aguias"]
    before = [
        client.get(url).json()
        for url in (f"{CLUBS_URL}/{aguias['id']}", f"{CLUBS_URL}/{aguias['id']}/lineup")
    ]

    play(client, aguias["id"], league["delta"]["id"])

    after = [
        client.get(url).json()
        for url in (f"{CLUBS_URL}/{aguias['id']}", f"{CLUBS_URL}/{aguias['id']}/lineup")
    ]
    assert after == before


def test_stored_match_keeps_the_data_of_the_moment(client: TestClient, league: dict) -> None:
    otto = league["aguias"]["players"]["Otto Rangel"]
    play(client, league["aguias"]["id"], league["delta"]["id"])
    client.put(
        f"{PLAYERS_URL}/{otto}",
        json={"name": "Otto Rangel Filho", "position": "ATA", "agility": 85, "age": 30},
    )
    client.patch(f"{PLAYERS_URL}/{otto}/condition", json={"condition": "MAL_CONDICIONADO"})

    attacker = client.get(f"{MATCHES_URL}/1").json()["duels"][0]["attacker"]

    assert (attacker["player_name"], attacker["condition"], attacker["value"]) == (
        "Otto Rangel",
        "APTO",
        75,
    )


def test_same_matchup_can_be_repeated_with_the_same_result(
    client: TestClient, league: dict
) -> None:
    results = [play(client, league["aguias"]["id"], league["delta"]["id"]).json() for _ in range(2)]

    assert results[0]["id"] != results[1]["id"]
    assert results[0]["duels"] == results[1]["duels"]


def test_two_midfielders_follow_the_name(client: TestClient, engine: Engine, league: dict) -> None:
    starters = {
        "Ivo Goleiro": {"position": "GOL"},
        "Zeca Zagueiro": {"position": "ZAG"},
        "Bia Meia": {"position": "MEI", "passing": 60},
        "Ana Meia": {"position": "MEI", "passing": 61},
        "Ari Atacante": {"position": "ATA"},
    }
    gama = build_team(client, engine, "Gama SC", "GSC", starters, "1-2-1")

    duels = play(client, gama["id"], league["delta"]["id"]).json()["duels"]

    assert [duel["attacker"]["player_name"] for duel in duels[:3]] == [
        "Ari Atacante",
        "Bia Meia",
        "Ana Meia",
    ]
    assert duels[5]["defender"]["player_name"] == "Ana Meia"


@pytest.mark.parametrize(
    "body",
    [
        {"home_club_id": 1, "away_club_id": 1},
        {"home_club_id": 1},
        {"away_club_id": 2},
        {"home_club_id": None, "away_club_id": 2},
        {"home_club_id": 0, "away_club_id": 2},
        {"home_club_id": -1, "away_club_id": 2},
        {"home_club_id": "1", "away_club_id": 2},
        {"home_club_id": 1.5, "away_club_id": 2},
        {"homeClubId": 1, "away_club_id": 2},
        [{"home_club_id": 1, "away_club_id": 2}],
    ],
    ids=[
        "mesmo-clube",
        "sem-visitante",
        "sem-mandante",
        "mandante-nulo",
        "id-zero",
        "id-negativo",
        "id-texto",
        "id-fracao",
        "camelCase",
        "corpo-array",
    ],
)
def test_invalid_body_is_400(
    client: TestClient, engine: Engine, league: dict, body: object
) -> None:
    response = client.post(MATCHES_URL, json=body)

    assert response.status_code == 400
    assert response.json()["message"]
    assert count_rows(engine, "partidas") == 0


def test_missing_club_is_404(client: TestClient, engine: Engine, league: dict) -> None:
    assert play(client, league["aguias"]["id"], 999).status_code == 404
    assert play(client, 999, league["delta"]["id"]).status_code == 404
    assert count_rows(engine, "partidas") == 0


@pytest.mark.parametrize("side", ["mandante", "visitante"])
def test_club_without_complete_lineup_is_409(
    client: TestClient, engine: Engine, league: dict, side: str
) -> None:
    newcomer = create_club(client, "Gama SC", "GSC")
    sell(client, league["delta"]["players"]["Ugo Falcão"])
    for home, away in (
        (newcomer, league["aguias"]["id"]),
        (league["delta"]["id"], league["aguias"]["id"]),
    ):
        teams = (home, away) if side == "mandante" else (away, home)
        response = play(client, *teams)
        assert response.status_code == 409
        assert response.json()["message"]
    assert count_rows(engine, "partidas") == 0
    assert count_rows(engine, "duelos_partida") == 0


def test_history_is_newest_first_without_duels_and_filters_by_club(
    client: TestClient, engine: Engine, league: dict, freeze_clock: Freeze
) -> None:
    aguias, delta = league["aguias"]["id"], league["delta"]["id"]
    gama = build_team(client, engine, "Gama SC", "GSC", THIRD_TEAM_STARTERS, "2-1-1")["id"]
    freeze_clock(NOW + timedelta(hours=1))
    play(client, aguias, delta)
    freeze_clock(NOW + timedelta(hours=2))
    play(client, gama, delta)
    play(client, gama, aguias)

    every = client.get(MATCHES_URL).json()
    with_delta = client.get(f"{MATCHES_URL}?club_id={delta}").json()

    assert [match["id"] for match in every] == [3, 2, 1]
    assert "duels" not in every[0]
    assert set(every[0]) == {"id", "played_at", "home", "away", "result"}
    assert [match["id"] for match in with_delta] == [2, 1]


def test_empty_history_is_200(client: TestClient) -> None:
    response = client.get(MATCHES_URL)

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize(
    ("query", "status"),
    [("club_id=999", 404), ("club_id=abc", 400), ("club_id=0", 400), ("club_id=", 400)],
)
def test_history_filter_errors(client: TestClient, query: str, status: int) -> None:
    assert client.get(f"{MATCHES_URL}?{query}").status_code == status


@pytest.mark.parametrize("raw_id", ["1", "999", "abc", "0", "01"])
def test_missing_match_is_404(client: TestClient, raw_id: str) -> None:
    response = client.get(f"{MATCHES_URL}/{raw_id}")

    assert response.status_code == 404
    assert response.json()["message"]
