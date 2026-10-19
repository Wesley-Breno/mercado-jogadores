from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response
from sqlalchemy import Engine

from tests.api.test_clubs import AGUIAS, CLUBS_URL, NOW, create_club, create_player, set_cash
from tests.api.test_players_create import PLAYERS_URL
from tests.conftest import count_rows

LOYALTY_UNTIL = "2027-03-02T10:15-03:00"


@pytest.fixture
def market(client: TestClient, freeze_clock: Callable[[datetime], None]) -> TestClient:
    freeze_clock(NOW)
    return client


def buy(client: TestClient, player_id: int | str, body: object) -> Response:
    return client.post(f"{PLAYERS_URL}/{player_id}/buy", json=body)


def test_buy_follows_the_example_of_the_statement(market: TestClient) -> None:
    club_id = create_club(market, **AGUIAS)
    player_id = create_player(market)
    market.patch(f"{PLAYERS_URL}/{player_id}/condition", json={"condition": "MAL_CONDICIONADO"})

    response = buy(market, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "club_id": club_id,
        "player_id": player_id,
        "player_name": "Meia Lua",
        "type": "COMPRA",
        "value": 37.0,
        "fee": 1.85,
        "penalty": 0.0,
        "profit": None,
        "cash_change": -38.85,
        "created_at": "2026-11-02T10:15:00-03:00",
        "contract": {
            "purchase_value": 37.0,
            "loyalty_until": "2027-03-02T10:15:00-03:00",
            "status": "ATIVO",
        },
        "club_cash": 261.15,
    }
    club = market.get(f"{CLUBS_URL}/{club_id}").json()
    assert (club["cash"], club["squad_value"], club["net_worth"]) == (261.15, 37.0, 298.15)
    assert club["players"][0]["contract"] == {
        "purchase_value": 37.0,
        "loyalty_until": "2027-03-02T10:15:00-03:00",
        "remaining_days": 120,
        "penalty_rate": 10,
    }
    assert market.get(f"{PLAYERS_URL}/{player_id}").json()["club_id"] == club_id
    assert market.get(f"{PLAYERS_URL}?free=true").json()["data"] == []


def test_price_without_fee_up_to_30(market: TestClient) -> None:
    club_id = create_club(market, **AGUIAS)
    player_id = create_player(market, position="ZAG")

    body = buy(market, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL}).json()

    assert (body["value"], body["fee"], body["cash_change"], body["club_cash"]) == (
        16.0,
        0.0,
        -16.0,
        284.0,
    )


@pytest.mark.parametrize(
    ("cash", "accepted"),
    [("84.00", True), ("83.99", False)],
    ids=["custo-igual-a-metade", "custo-acima-da-metade-sem-arredondar"],
)
def test_total_cost_up_to_half_of_the_cash(
    market: TestClient, engine: Engine, cash: str, accepted: bool
) -> None:
    club_id = create_club(market, **AGUIAS)
    set_cash(engine, club_id, cash)
    player_id = create_player(market)

    response = buy(market, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})

    assert response.status_code == (200 if accepted else 409)
    if not accepted:
        assert response.json()["message"]
        assert_nothing_was_bought(market, engine, club_id, player_id, cash)


def assert_nothing_was_bought(
    client: TestClient, engine: Engine, club_id: int, player_id: int, cash: str
) -> None:
    assert client.get(f"{CLUBS_URL}/{club_id}").json()["cash"] == float(cash)
    assert client.get(f"{PLAYERS_URL}/{player_id}").json()["club_id"] is None
    assert count_rows(engine, "contratos") == 0
    assert count_rows(engine, "transacoes") == 0


def test_player_who_is_not_free_cannot_be_bought(market: TestClient, engine: Engine) -> None:
    first = create_club(market, **AGUIAS)
    second = create_club(market, "Delta FC", "DFC")
    player_id = create_player(market)
    buy(market, player_id, {"club_id": first, "loyalty_until": LOYALTY_UNTIL})

    response = buy(market, player_id, {"club_id": second, "loyalty_until": LOYALTY_UNTIL})

    assert response.status_code == 409
    assert count_rows(engine, "transacoes") == 1


def test_squad_holds_at_most_12_players(market: TestClient, engine: Engine) -> None:
    club_id = create_club(market, **AGUIAS)
    set_cash(engine, club_id, "99999.00")
    for index in range(12):
        player_id = create_player(market, name=f"Zagueiro {chr(65 + index)}", position="ZAG")
        buy(market, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    thirteenth = create_player(market, name="Zagueiro Extra", position="ZAG")

    response = buy(market, thirteenth, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})

    assert response.status_code == 409
    assert len(market.get(f"{CLUBS_URL}/{club_id}").json()["players"]) == 12


def test_loyalty_window_limits(market: TestClient) -> None:
    club_id = create_club(market, **AGUIAS)
    limit = (NOW + timedelta(days=1095)).strftime("%Y-%m-%dT%H:%M-03:00")
    beyond = (NOW + timedelta(days=1095, minutes=1)).strftime("%Y-%m-%dT%H:%M-03:00")
    first, second = create_player(market), create_player(market, name="Lua Nova")

    assert buy(market, first, {"club_id": club_id, "loyalty_until": beyond}).status_code == 400
    assert buy(market, first, {"club_id": club_id, "loyalty_until": limit}).status_code == 200
    assert (
        buy(market, second, {"club_id": club_id, "loyalty_until": "2026-11-02T10:15-03:00"})
    ).status_code == 400


INVALID_BODIES = {
    "sem-club_id": {"loyalty_until": LOYALTY_UNTIL},
    "club_id-nulo": {"club_id": None, "loyalty_until": LOYALTY_UNTIL},
    "club_id-texto": {"club_id": "1", "loyalty_until": LOYALTY_UNTIL},
    "club_id-zero": {"club_id": 0, "loyalty_until": LOYALTY_UNTIL},
    "club_id-negativo": {"club_id": -1, "loyalty_until": LOYALTY_UNTIL},
    "club_id-fracao": {"club_id": 1.5, "loyalty_until": LOYALTY_UNTIL},
    "club_id-booleano": {"club_id": True, "loyalty_until": LOYALTY_UNTIL},
    "sem-loyalty_until": {"club_id": 1},
    "loyalty_until-nulo": {"club_id": 1, "loyalty_until": None},
    "sem-fuso": {"club_id": 1, "loyalty_until": "2027-03-02T10:15"},
    "com-segundos": {"club_id": 1, "loyalty_until": "2027-03-02T10:15:00-03:00"},
    "outro-fuso": {"club_id": 1, "loyalty_until": "2027-03-02T10:15-02:00"},
    "utc": {"club_id": 1, "loyalty_until": "2027-03-02T13:15Z"},
    "sem-T": {"club_id": 1, "loyalty_until": "2027-03-02 10:15-03:00"},
    "formato-brasileiro": {"club_id": 1, "loyalty_until": "02/03/2027 10:15"},
    "dia-inexistente": {"club_id": 1, "loyalty_until": "2027-02-30T10:15-03:00"},
    "hora-24": {"club_id": 1, "loyalty_until": "2027-03-02T24:00-03:00"},
    "numero": {"club_id": 1, "loyalty_until": 20270302},
    "no-passado": {"club_id": 1, "loyalty_until": "2026-11-01T10:15-03:00"},
    "loyaltyUntil-camelCase": {"club_id": 1, "loyaltyUntil": LOYALTY_UNTIL},
    "corpo-array": [{"club_id": 1, "loyalty_until": LOYALTY_UNTIL}],
}


@pytest.mark.parametrize("body", INVALID_BODIES.values(), ids=INVALID_BODIES.keys())
def test_invalid_purchase_is_400_and_saves_nothing(
    market: TestClient, engine: Engine, body: object
) -> None:
    club_id = create_club(market, **AGUIAS)
    player_id = create_player(market)

    response = buy(market, player_id, body)

    assert response.status_code == 400
    assert response.json()["message"]
    assert_nothing_was_bought(market, engine, club_id, player_id, "300.00")


def test_missing_club_or_player_is_404(market: TestClient) -> None:
    club_id = create_club(market, **AGUIAS)
    player_id = create_player(market)
    deleted = create_player(market, name="Zé Excluído")
    market.delete(f"{PLAYERS_URL}/{deleted}")
    body = {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL}

    assert buy(market, 999, body).status_code == 404
    assert buy(market, "abc", body).status_code == 404
    assert buy(market, deleted, body).status_code == 404
    assert buy(market, player_id, {**body, "club_id": 999}).status_code == 404
    assert buy(market, player_id, {**body, "club_id": 2147483648}).status_code == 404
