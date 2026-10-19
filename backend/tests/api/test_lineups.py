from collections.abc import Callable
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response
from sqlalchemy import Engine

from tests.api.test_clubs import AGUIAS, CLUBS_URL, NOW, create_club, create_player, set_cash
from tests.api.test_market_buy import LOYALTY_UNTIL, buy
from tests.api.test_market_sell import sell
from tests.api.test_players_create import PLAYERS_URL
from tests.conftest import count_rows

SQUAD = {
    "Rui Prado": "GOL",
    "Gil Goleiro": "GOL",
    "Téo Brandão": "ZAG",
    "Zeca Zagueiro": "ZAG",
    "Davi Lins": "LAT",
    "Lia Lateral": "LAT",
    "Lauro Neves": "MEI",
    "Mel Meia": "MEI",
    "Otto Rangel": "ATA",
    "Ari Atacante": "ATA",
}
LINEUPS = {
    "3-1": ["Rui Prado", "Téo Brandão", "Davi Lins", "Lia Lateral", "Otto Rangel"],
    "2-2": ["Rui Prado", "Téo Brandão", "Davi Lins", "Ari Atacante", "Otto Rangel"],
    "2-1-1": ["Rui Prado", "Téo Brandão", "Davi Lins", "Lauro Neves", "Otto Rangel"],
    "1-2-1": ["Rui Prado", "Téo Brandão", "Lauro Neves", "Mel Meia", "Otto Rangel"],
}


@pytest.fixture
def club(client: TestClient, engine: Engine, freeze_clock: Callable[[datetime], None]) -> dict:
    """Águias FC with two players of each position, all bought through the API."""
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    set_cash(engine, club_id, "99999.00")
    ids = {}
    for name, position in SQUAD.items():
        ids[name] = create_player(client, name=name, position=position)
        buy(client, ids[name], {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    return {"id": club_id, "players": ids}


def lineup_url(club_id: int | str) -> str:
    return f"{CLUBS_URL}/{club_id}/lineup"


def put_lineup(client: TestClient, club: dict, formation: str, names: list[str]) -> Response:
    ids = [club["players"][name] for name in reversed(names)]
    return client.put(lineup_url(club["id"]), json={"formation": formation, "player_ids": ids})


@pytest.mark.parametrize("formation", list(LINEUPS))
def test_each_formation_is_accepted_and_shown_in_squad_order(
    client: TestClient, club: dict, formation: str
) -> None:
    response = put_lineup(client, club, formation, LINEUPS[formation])

    assert response.status_code == 200
    body = response.json()
    assert (body["club_id"], body["formation"], body["complete"]) == (club["id"], formation, True)
    assert [player["name"] for player in body["players"]] == LINEUPS[formation]
    assert set(body["players"][0]) >= {"id", "market_value", "overall", "condition", "defending"}
    assert client.get(lineup_url(club["id"])).json() == body


def test_lineup_replaces_the_previous_one_without_touching_the_cash(
    client: TestClient, engine: Engine, club: dict
) -> None:
    cash_before = client.get(f"{CLUBS_URL}/{club['id']}").json()["cash"]
    put_lineup(client, club, "2-1-1", LINEUPS["2-1-1"])

    body = put_lineup(client, club, "1-2-1", LINEUPS["1-2-1"]).json()

    assert [player["name"] for player in body["players"]] == LINEUPS["1-2-1"]
    assert count_rows(engine, "escalacoes") == 5
    assert client.get(f"{CLUBS_URL}/{club['id']}").json()["cash"] == cash_before


def test_unfit_player_can_start(client: TestClient, club: dict) -> None:
    client.patch(
        f"{PLAYERS_URL}/{club['players']['Davi Lins']}/condition",
        json={"condition": "MAL_CONDICIONADO"},
    )

    assert put_lineup(client, club, "2-1-1", LINEUPS["2-1-1"]).status_code == 200


def test_club_without_lineup(client: TestClient) -> None:
    club_id = create_club(client, **AGUIAS)

    response = client.get(lineup_url(club_id))

    assert response.status_code == 200
    assert response.json() == {
        "club_id": club_id,
        "formation": None,
        "complete": False,
        "players": [],
    }


@pytest.mark.parametrize(
    ("formation", "names"),
    [
        ("2-2", LINEUPS["2-1-1"]),
        ("3-1", LINEUPS["2-1-1"]),
        ("2-1-1", ["Rui Prado", "Gil Goleiro", "Davi Lins", "Lauro Neves", "Otto Rangel"]),
        ("2-1-1", ["Zeca Zagueiro", "Téo Brandão", "Davi Lins", "Lauro Neves", "Otto Rangel"]),
    ],
    ids=["2-2-sem-segundo-ATA", "3-1-com-MEI", "dois-GOL", "sem-GOL"],
)
def test_positions_that_do_not_fit_are_409_and_change_nothing(
    client: TestClient, club: dict, formation: str, names: list[str]
) -> None:
    put_lineup(client, club, "1-2-1", LINEUPS["1-2-1"])

    response = put_lineup(client, club, formation, names)

    assert response.status_code == 409
    assert response.json()["message"]
    assert client.get(lineup_url(club["id"])).json()["formation"] == "1-2-1"


def test_sick_player_cannot_start(client: TestClient, club: dict) -> None:
    client.patch(
        f"{PLAYERS_URL}/{club['players']['Otto Rangel']}/condition", json={"condition": "DOENTE"}
    )

    assert put_lineup(client, club, "2-1-1", LINEUPS["2-1-1"]).status_code == 409


def test_players_outside_the_squad_cannot_start(client: TestClient, club: dict) -> None:
    other_club = create_club(client, "Delta FC", "DFC")
    free_player = create_player(client, name="Zé Livre", position="ATA")
    other_player = create_player(client, name="Ivo Teles", position="GOL")
    buy(client, other_player, {"club_id": other_club, "loyalty_until": LOYALTY_UNTIL})
    starters = [club["players"][name] for name in LINEUPS["2-1-1"]]

    with_free = [*starters[:4], free_player]
    with_other = [other_player, *starters[1:]]

    for ids in (with_free, with_other):
        response = client.put(
            lineup_url(club["id"]), json={"formation": "2-1-1", "player_ids": ids}
        )
        assert response.status_code == 409
    assert client.get(lineup_url(club["id"])).json()["formation"] is None


INVALID_BODIES = {
    "sem-formation": {"player_ids": [1, 2, 3, 4, 5]},
    "formation-fora-da-lista": {"formation": "4-4-2", "player_ids": [1, 2, 3, 4, 5]},
    "formation-nula": {"formation": None, "player_ids": [1, 2, 3, 4, 5]},
    "sem-player_ids": {"formation": "2-1-1"},
    "player_ids-texto": {"formation": "2-1-1", "player_ids": "1,2,3,4,5"},
    "player_ids-nulo": {"formation": "2-1-1", "player_ids": None},
    "quatro-ids": {"formation": "2-1-1", "player_ids": [1, 2, 3, 4]},
    "seis-ids": {"formation": "2-1-1", "player_ids": [1, 2, 3, 4, 5, 6]},
    "ids-repetidos": {"formation": "2-1-1", "player_ids": [1, 2, 3, 4, 4]},
    "id-zero": {"formation": "2-1-1", "player_ids": [0, 2, 3, 4, 5]},
    "id-negativo": {"formation": "2-1-1", "player_ids": [-1, 2, 3, 4, 5]},
    "id-texto": {"formation": "2-1-1", "player_ids": ["1", 2, 3, 4, 5]},
    "id-fracao": {"formation": "2-1-1", "player_ids": [1.5, 2, 3, 4, 5]},
    "id-booleano": {"formation": "2-1-1", "player_ids": [True, 2, 3, 4, 5]},
    "corpo-array": [{"formation": "2-1-1", "player_ids": [1, 2, 3, 4, 5]}],
}


@pytest.mark.parametrize("body", INVALID_BODIES.values(), ids=INVALID_BODIES.keys())
def test_invalid_body_is_400(client: TestClient, engine: Engine, body: object) -> None:
    club_id = create_club(client, **AGUIAS)

    response = client.put(lineup_url(club_id), json=body)

    assert response.status_code == 400
    assert response.json()["message"]
    assert count_rows(engine, "escalacoes") == 0


def test_missing_club_or_player_is_404(client: TestClient, club: dict) -> None:
    starters = [club["players"][name] for name in LINEUPS["2-1-1"]]
    deleted = create_player(client, name="Zé Excluído", position="ATA")
    client.delete(f"{PLAYERS_URL}/{deleted}")
    body = {"formation": "2-1-1", "player_ids": starters}

    assert client.put(lineup_url(999), json=body).status_code == 404
    assert client.put(lineup_url("abc"), json=body).status_code == 404
    assert client.get(lineup_url(999)).status_code == 404
    for missing in (999, deleted):
        response = client.put(
            lineup_url(club["id"]), json={**body, "player_ids": [*starters[:4], missing]}
        )
        assert response.status_code == 404


@pytest.mark.parametrize("leaves", ["venda", "doente"])
def test_starter_who_is_sold_or_gets_sick_leaves_and_does_not_come_back(
    client: TestClient, club: dict, leaves: str
) -> None:
    put_lineup(client, club, "2-1-1", LINEUPS["2-1-1"])
    otto = club["players"]["Otto Rangel"]
    if leaves == "venda":
        sell(client, otto)
    else:
        client.patch(f"{PLAYERS_URL}/{otto}/condition", json={"condition": "DOENTE"})
        client.patch(f"{PLAYERS_URL}/{otto}/condition", json={"condition": "MAL_CONDICIONADO"})

    body = client.get(lineup_url(club["id"])).json()

    assert body["formation"] == "2-1-1"
    assert body["complete"] is False
    assert [player["name"] for player in body["players"]] == LINEUPS["2-1-1"][:4]
