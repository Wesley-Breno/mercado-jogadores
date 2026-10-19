from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response
from sqlalchemy import Engine, text

from app.core.clock import BRASILIA_TZ
from tests.api.test_clubs import AGUIAS, CLUBS_URL, NOW, create_club, create_player, set_cash
from tests.api.test_market_buy import LOYALTY_UNTIL, buy
from tests.api.test_players_create import PLAYERS_URL
from tests.conftest import count_rows

SALE_MOMENT = datetime(2026, 11, 5, 16, 40, tzinfo=BRASILIA_TZ)
STRONG_MIDFIELDER = {
    "name": "Craque Caro",
    "pace": 90,
    "shooting": 90,
    "passing": 90,
    "dribbling": 90,
    "defending": 60,
    "physical": 60,
    "potential": 90,
}

Freeze = Callable[[datetime], None]


def sell(client: TestClient, player_id: int | str) -> Response:
    return client.post(f"{PLAYERS_URL}/{player_id}/sell")


def loyalty(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M-03:00")


def test_sale_follows_the_example_of_the_statement(
    client: TestClient, freeze_clock: Freeze
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client)
    client.patch(f"{PLAYERS_URL}/{player_id}/condition", json={"condition": "MAL_CONDICIONADO"})
    buy(client, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    client.patch(f"{PLAYERS_URL}/{player_id}/condition", json={"condition": "APTO"})
    freeze_clock(SALE_MOMENT)

    response = client.post(f"{PLAYERS_URL}/{player_id}/sell", json={"ignored": True})

    assert response.status_code == 200
    assert response.json() == {
        "id": 2,
        "club_id": club_id,
        "player_id": player_id,
        "player_name": "Meia Lua",
        "type": "VENDA",
        "value": 40.0,
        "fee": 0.3,
        "penalty": 4.0,
        "profit": 3.0,
        "cash_change": 35.7,
        "created_at": "2026-11-05T16:40:00-03:00",
        "purchase_value": 37.0,
        "remaining_days": 117,
        "penalty_rate": 10,
        "contract_status": "RESCINDIDO",
        "club_cash": 296.85,
    }
    assert client.get(f"{PLAYERS_URL}/{player_id}").json()["club_id"] is None
    assert [p["id"] for p in client.get(f"{PLAYERS_URL}?free=true").json()["data"]] == [player_id]
    assert client.get(f"{CLUBS_URL}/{club_id}").json()["players"] == []


@pytest.mark.parametrize(
    ("loyalty_left", "days", "rate", "penalty", "status"),
    [
        (timedelta(minutes=-1), 0, 0, 0.0, "ENCERRADO"),
        (timedelta(0), 0, 0, 0.0, "ENCERRADO"),
        (timedelta(days=10, hours=2), 11, 5, 2.0, "RESCINDIDO"),
        (timedelta(days=30), 30, 5, 2.0, "RESCINDIDO"),
        (timedelta(days=30, minutes=1), 31, 10, 4.0, "RESCINDIDO"),
        (timedelta(days=180), 180, 10, 4.0, "RESCINDIDO"),
        (timedelta(days=180, minutes=1), 181, 20, 8.0, "RESCINDIDO"),
    ],
)
def test_penalty_by_remaining_days(
    client: TestClient,
    freeze_clock: Freeze,
    loyalty_left: timedelta,
    days: int,
    rate: int,
    penalty: float,
    status: str,
) -> None:
    freeze_clock(SALE_MOMENT - timedelta(days=1))
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client)
    buy(
        client,
        player_id,
        {"club_id": club_id, "loyalty_until": loyalty(SALE_MOMENT + loyalty_left)},
    )
    freeze_clock(SALE_MOMENT)

    body = sell(client, player_id).json()

    assert (body["remaining_days"], body["penalty_rate"]) == (days, rate)
    assert (body["penalty"], body["contract_status"]) == (penalty, status)
    assert body["cash_change"] == 40.0 - penalty


def test_penalty_is_capped_at_10(client: TestClient, freeze_clock: Freeze) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client, **STRONG_MIDFIELDER)
    buy(client, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    freeze_clock(NOW + timedelta(days=1))

    body = sell(client, player_id).json()

    assert (body["value"], body["penalty_rate"], body["penalty"]) == (106.0, 10, 10.0)


def test_loss_has_no_commission(client: TestClient, freeze_clock: Freeze) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client)
    buy(client, player_id, {"club_id": club_id, "loyalty_until": loyalty(NOW + timedelta(days=1))})
    client.patch(f"{PLAYERS_URL}/{player_id}/condition", json={"condition": "MAL_CONDICIONADO"})
    freeze_clock(NOW + timedelta(days=2))

    body = sell(client, player_id).json()

    assert (body["value"], body["profit"], body["fee"], body["penalty"]) == (37.0, -3.0, 0.0, 0.0)
    assert (body["cash_change"], body["contract_status"]) == (37.0, "ENCERRADO")


def test_cash_reconciles_with_the_transactions(
    client: TestClient, engine: Engine, freeze_clock: Freeze
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    first, second = create_player(client), create_player(client, name="Lua Nova", position="ZAG")
    for player_id in (first, second):
        buy(client, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    freeze_clock(SALE_MOMENT)
    sell(client, first)

    with engine.connect() as connection:
        total_change = connection.scalar(text("SELECT sum(variacao_caixa) FROM transacoes"))
    cash = client.get(f"{CLUBS_URL}/{club_id}").json()["cash"]

    assert 300 + float(total_change) == pytest.approx(cash)


def test_free_player_cannot_be_sold(client: TestClient, engine: Engine) -> None:
    player_id = create_player(client)

    response = sell(client, player_id)

    assert response.status_code == 409
    assert response.json()["message"]
    assert count_rows(engine, "transacoes") == 0


def test_missing_or_deleted_player_cannot_be_sold(client: TestClient) -> None:
    deleted = create_player(client)
    client.delete(f"{PLAYERS_URL}/{deleted}")

    assert sell(client, deleted).status_code == 404
    assert sell(client, 999).status_code == 404
    assert sell(client, "01").status_code == 404


def test_seller_cannot_buy_back_but_another_club_can(
    client: TestClient, freeze_clock: Freeze
) -> None:
    freeze_clock(NOW)
    seller = create_club(client, **AGUIAS)
    other = create_club(client, "Delta FC", "DFC")
    player_id = create_player(client)
    body = {"club_id": seller, "loyalty_until": LOYALTY_UNTIL}
    buy(client, player_id, body)
    sell(client, player_id)

    assert buy(client, player_id, body).status_code == 409
    assert buy(client, player_id, {**body, "club_id": other}).status_code == 200


def test_sold_starter_leaves_the_lineup(
    client: TestClient, engine: Engine, freeze_clock: Freeze
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client)
    buy(client, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    with engine.begin() as connection:
        connection.execute(
            text("INSERT INTO escalacoes (clube_id, jogador_id, criado_em) VALUES (:c, :p, now())"),
            {"c": club_id, "p": player_id},
        )

    sell(client, player_id)

    assert count_rows(engine, "escalacoes") == 0


def test_low_cash_does_not_block_a_sale(
    client: TestClient, engine: Engine, freeze_clock: Freeze
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client)
    buy(client, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    set_cash(engine, club_id, "0.00")

    response = sell(client, player_id)

    assert response.status_code == 200
    assert response.json()["club_cash"] == response.json()["cash_change"]
