"""B18 and B19: history with the name and values of the moment, filters, summary and CSV export."""

import httpx2
import pytest

from conformance.support import bought, cheap_player, club, create_club, create_player

HEADER = "data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa"


@pytest.fixture(scope="module")
def epsilon(api: httpx2.Client) -> dict:
    """Two purchases, a sale, a renamed player and a sold player that was deleted."""
    epsilon = create_club(api, "Épsilon EC", "EPS")
    kept = create_player(api, name="Heitor Gomes")
    rocket = create_player(api, name='Zé "Foguete" Lima')
    gone = cheap_player(api, "Rafael Nogueira")
    for player in (kept, rocket, gone):
        bought(api, player["id"], epsilon["id"], days=400)
    api.post(f"/players/{rocket['id']}/sell")
    api.post(f"/players/{gone['id']}/sell")
    api.delete(f"/players/{gone['id']}")
    api.put(
        f"/players/{kept['id']}",
        json={"name": "Heitor Gomes Filho", "position": "MEI", "agility": 85, "age": 25},
    )
    return {**epsilon, "kept": kept, "rocket": rocket, "gone": gone}


def history(api: httpx2.Client, club_id: int, query: str = "") -> dict:
    response = api.get(f"/clubs/{club_id}/transactions{query}")
    assert response.status_code == 200, response.text
    return response.json()


def test_b18_order_names_of_the_moment_and_cash_reconciliation(
    api: httpx2.Client, epsilon: dict
) -> None:
    body = history(api, epsilon["id"])

    ids = [transaction["id"] for transaction in body["data"]]
    assert ids == sorted(ids, reverse=True)
    assert "Heitor Gomes" in {transaction["player_name"] for transaction in body["data"]}
    assert "Heitor Gomes Filho" not in {transaction["player_name"] for transaction in body["data"]}
    assert len(body["data"]) == 5
    total = 300 + sum(transaction["cash_change"] for transaction in body["data"])
    assert round(total, 2) == club(api, epsilon["id"])["cash"]


def test_b18_summary_follows_the_filters(api: httpx2.Client, epsilon: dict) -> None:
    for query in ("", "?type=COMPRA", "?type=VENDA", "?type=COMPRA,VENDA"):
        body = history(api, epsilon["id"], query)
        purchases = [item for item in body["data"] if item["type"] == "COMPRA"]
        sales = [item for item in body["data"] if item["type"] == "VENDA"]

        assert body["summary"] == {
            "total_spent": round(sum(item["value"] + item["fee"] for item in purchases), 2),
            "total_received": round(sum(item["cash_change"] for item in sales), 2),
            "total_fees": round(sum(item["fee"] for item in body["data"]), 2),
            "total_penalties": round(sum(item["penalty"] for item in sales), 2),
            "total_profit": round(sum(item["profit"] for item in sales), 2),
        }, query


def test_b18_filters_by_type_and_by_player_and_their_refusals(
    api: httpx2.Client, epsilon: dict
) -> None:
    sales = history(api, epsilon["id"], "?type=VENDA")["data"]
    rocket = history(api, epsilon["id"], f"?player_id={epsilon['rocket']['id']}")["data"]

    assert {item["type"] for item in sales} == {"VENDA"}
    assert [item["type"] for item in rocket] == ["VENDA", "COMPRA"]
    assert (
        api.get(
            f"/clubs/{epsilon['id']}/transactions?player_id={epsilon['gone']['id']}"
        ).status_code
        == 404
    )
    for query in ("type=COMPRA,COMPRA", "type=venda", "type=", "player_id=abc"):
        assert api.get(f"/clubs/{epsilon['id']}/transactions?{query}").status_code == 400, query
    assert api.get("/clubs/99999/transactions").status_code == 404


def test_b19_csv_file_of_the_history(api: httpx2.Client, epsilon: dict) -> None:
    response = api.get(f"/clubs/{epsilon['id']}/transactions/export")
    transactions = history(api, epsilon["id"])["data"]

    raw = response.content
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert not raw.startswith(b"\xef\xbb\xbf")
    assert b"\r" not in raw
    assert raw.endswith(b"\n")
    lines = raw.decode("utf-8").split("\n")[:-1]
    assert lines[0] == HEADER
    assert [line.split(";")[0] for line in lines[1:]] == [
        item["created_at"] for item in transactions
    ]
    purchase = next(line for line in lines if ";COMPRA;Heitor Gomes;" in line)
    assert purchase.endswith(";40,00;2,00;0,00;;-42,00")
    assert any(line.split(";")[2] == '"Zé ""Foguete"" Lima"' for line in lines)


def test_b19_csv_filters_and_errors_in_json(api: httpx2.Client, epsilon: dict) -> None:
    sales = api.get(f"/clubs/{epsilon['id']}/transactions/export?type=VENDA").text.split("\n")[1:-1]
    refused = api.get(f"/clubs/{epsilon['id']}/transactions/export?type=TROCA")

    assert sales
    assert all(line.split(";")[1] == "VENDA" for line in sales)
    assert refused.status_code == 400
    assert refused.json()["message"]
    assert api.get("/clubs/99999/transactions/export").status_code == 404
