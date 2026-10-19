from collections.abc import Callable
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from tests.api.test_clubs import AGUIAS, CLUBS_URL, NOW, create_club, create_player
from tests.api.test_market_buy import LOYALTY_UNTIL, buy
from tests.api.test_market_sell import SALE_MOMENT, sell
from tests.api.test_players_create import PLAYERS_URL

HEADER = "data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n"
SALE_LINE = "2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n"
PURCHASE_LINE = "2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n"


@pytest.fixture
def history(client: TestClient, freeze_clock: Callable[[datetime], None]) -> dict[str, int]:
    """The example of the statement: Meia Lua bought by Águias FC and sold three days later."""
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    player_id = create_player(client)
    client.patch(f"{PLAYERS_URL}/{player_id}/condition", json={"condition": "MAL_CONDICIONADO"})
    buy(client, player_id, {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL})
    client.patch(f"{PLAYERS_URL}/{player_id}/condition", json={"condition": "APTO"})
    freeze_clock(SALE_MOMENT)
    sell(client, player_id)
    return {"club_id": club_id, "player_id": player_id}


def transactions_url(club_id: int | str, query: str = "", export: bool = False) -> str:
    suffix = "/export" if export else ""
    return f"{CLUBS_URL}/{club_id}/transactions{suffix}?{query}"


def test_history_is_newest_first_with_summary(client: TestClient, history: dict) -> None:
    body = client.get(transactions_url(history["club_id"])).json()

    assert [(t["type"], t["cash_change"]) for t in body["data"]] == [
        ("VENDA", 35.7),
        ("COMPRA", -38.85),
    ]
    assert body["data"][1]["profit"] is None
    assert body["data"][0]["created_at"] == "2026-11-05T16:40:00-03:00"
    assert body["summary"] == {
        "total_spent": 38.85,
        "total_received": 35.7,
        "total_fees": 2.15,
        "total_penalties": 4.0,
        "total_profit": 3.0,
    }


def test_type_filter_and_summary_respect_each_other(client: TestClient, history: dict) -> None:
    body = client.get(transactions_url(history["club_id"], "type=VENDA")).json()

    assert [t["type"] for t in body["data"]] == ["VENDA"]
    assert body["summary"] == {
        "total_spent": 0.0,
        "total_received": 35.7,
        "total_fees": 0.3,
        "total_penalties": 4.0,
        "total_profit": 3.0,
    }
    both = client.get(transactions_url(history["club_id"], "type=COMPRA,VENDA")).json()
    assert len(both["data"]) == 2


def test_player_filter(client: TestClient, history: dict) -> None:
    other = create_player(client, name="Lua Nova")
    url = transactions_url(history["club_id"], f"player_id={history['player_id']}")

    assert len(client.get(url).json()["data"]) == 2
    empty = client.get(transactions_url(history["club_id"], f"player_id={other}"))
    assert empty.status_code == 200
    assert empty.json() == {
        "data": [],
        "summary": {
            "total_spent": 0.0,
            "total_received": 0.0,
            "total_fees": 0.0,
            "total_penalties": 0.0,
            "total_profit": 0.0,
        },
    }


def test_history_keeps_the_name_of_the_moment_and_deleted_players(
    client: TestClient, history: dict
) -> None:
    edit = {"name": "Meia Lua Filho", "position": "MEI", "agility": 85, "age": 25}
    client.put(f"{PLAYERS_URL}/{history['player_id']}", json=edit)
    client.delete(f"{PLAYERS_URL}/{history['player_id']}")

    body = client.get(transactions_url(history["club_id"])).json()
    filtered = client.get(transactions_url(history["club_id"], f"player_id={history['player_id']}"))

    assert [t["player_name"] for t in body["data"]] == ["Meia Lua", "Meia Lua"]
    assert filtered.status_code == 404


def test_same_instant_is_ordered_by_id_descending(
    client: TestClient, freeze_clock: Callable[[datetime], None]
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    for name in ("Primeiro Jogador", "Segundo Jogador"):
        buy(
            client,
            create_player(client, name=name),
            {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL},
        )

    data = client.get(transactions_url(club_id)).json()["data"]

    assert [t["player_name"] for t in data] == ["Segundo Jogador", "Primeiro Jogador"]


def test_new_club_has_empty_history(client: TestClient) -> None:
    club_id = create_club(client, **AGUIAS)

    body = client.get(transactions_url(club_id)).json()

    assert body["data"] == []
    assert set(body["summary"].values()) == {0.0}


INVALID_FILTERS = [
    "type=compra",
    "type=COMPRA,venda",
    "type=COMPRA,COMPRA",
    "type=COMPRA,%20VENDA",
    "type=",
    "type=COMPRA,",
    "player_id=0",
    "player_id=-1",
    "player_id=abc",
    "player_id=01",
    "player_id=",
]


@pytest.mark.parametrize("query", INVALID_FILTERS)
@pytest.mark.parametrize("export", [False, True], ids=["json", "csv"])
def test_invalid_filter_is_400_in_json(client: TestClient, query: str, export: bool) -> None:
    club_id = create_club(client, **AGUIAS)

    response = client.get(transactions_url(club_id, query, export))

    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert response.json()["message"]


@pytest.mark.parametrize("export", [False, True], ids=["json", "csv"])
def test_missing_club_or_player_is_404_in_json(client: TestClient, export: bool) -> None:
    club_id = create_club(client, **AGUIAS)

    for url in (
        transactions_url(999, "", export),
        transactions_url("abc", "", export),
        transactions_url(club_id, "player_id=999", export),
    ):
        response = client.get(url)
        assert response.status_code == 404
        assert response.json()["message"]


def test_csv_matches_the_statement_byte_by_byte(client: TestClient, history: dict) -> None:
    response = client.get(transactions_url(history["club_id"], export=True))

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.content == (HEADER + SALE_LINE + PURCHASE_LINE).encode("utf-8")
    assert not response.content.startswith(b"\xef\xbb\xbf")
    assert b"\r" not in response.content


def test_csv_uses_the_same_filters(client: TestClient, history: dict) -> None:
    sales = client.get(transactions_url(history["club_id"], "type=VENDA", export=True))
    purchases = client.get(
        transactions_url(
            history["club_id"], f"type=COMPRA&player_id={history['player_id']}", export=True
        )
    )

    assert sales.text == HEADER + SALE_LINE
    assert purchases.text == HEADER + PURCHASE_LINE


def test_csv_without_transactions_has_only_the_header(client: TestClient) -> None:
    club_id = create_club(client, **AGUIAS)

    response = client.get(transactions_url(club_id, export=True))

    assert response.status_code == 200
    assert response.text == HEADER


def test_csv_quotes_names_with_semicolon_or_quotes(
    client: TestClient, freeze_clock: Callable[[datetime], None]
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    for name in ('Zé "Foguete" Lima', "Ana; Maria"):
        buy(
            client,
            create_player(client, name=name),
            {"club_id": club_id, "loyalty_until": LOYALTY_UNTIL},
        )

    lines = client.get(transactions_url(club_id, export=True)).text.splitlines()

    assert lines[1].split(";", 2)[2].startswith('"Ana; Maria";')
    assert lines[2].split(";", 2)[2].startswith('"Zé ""Foguete"" Lima";')
