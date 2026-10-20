"""B10 a B17: compra, recusas, fidelidade, sequência de compras, multa, venda e recompra."""

import httpx2
import pytest

from conformance.support import (
    bought,
    buy,
    cheap_player,
    club,
    create_club,
    create_player,
    loyalty_in,
)

RESERVES = [
    "Alves", "Barros", "Campos", "Dias", "Esteves", "Farias",
    "Gomes", "Hora", "Lima", "Matos", "Neves", "Reis",
]  # fmt: skip


@pytest.fixture(scope="module")
def tubaroes(api: httpx2.Client) -> dict:
    return create_club(api, "Tubarões EC", "TUB")


def test_b10_purchase_at_market_value_with_fee(api: httpx2.Client, tubaroes: dict) -> None:
    player = create_player(api, name="Otávio Rezende")

    purchase = bought(api, player["id"], tubaroes["id"])

    assert (purchase["type"], purchase["value"], purchase["fee"]) == ("COMPRA", 40.0, 2.0)
    assert (purchase["penalty"], purchase["profit"], purchase["cash_change"]) == (0.0, None, -42.0)
    assert purchase["contract"]["purchase_value"] == 40.0
    assert purchase["contract"]["status"] == "ATIVO"
    assert purchase["club_cash"] == 258.0
    assert api.get(f"/players/{player['id']}").json()["club_id"] == tubaroes["id"]
    summary = club(api, tubaroes["id"])
    assert (summary["cash"], summary["squad_value"], summary["net_worth"]) == (258.0, 40.0, 298.0)


def test_b11_purchase_refusals(api: httpx2.Client, tubaroes: dict) -> None:
    taken = api.get(f"/players?club_id={tubaroes['id']}").json()["data"][0]
    deleted = cheap_player(api, "Zé Sumido")
    api.delete(f"/players/{deleted['id']}")
    free = cheap_player(api, "Zé Livre")

    assert buy(api, taken["id"], tubaroes["id"]).status_code == 409
    assert buy(api, deleted["id"], tubaroes["id"]).status_code == 404
    assert buy(api, free["id"], 99999).status_code == 404
    for club_id in ("1", 0, -1, 1.5, None):
        response = api.post(
            f"/players/{free['id']}/buy", json={"club_id": club_id, "loyalty_until": loyalty_in(30)}
        )
        assert response.status_code == 400, club_id


def test_b11_squad_of_12_is_full(api: httpx2.Client) -> None:
    raposas = create_club(api, "Raposas EC", "REC")
    for surname in RESERVES:
        bought(api, cheap_player(api, f"Reserva {surname}")["id"], raposas["id"])

    response = buy(api, cheap_player(api, "Décimo Terceiro")["id"], raposas["id"])

    assert response.status_code == 409
    assert response.json()["message"]


@pytest.mark.parametrize(
    "loyalty_until",
    [
        "2027-03-02T10:15:00-03:00",
        "2027-03-02T10:15Z",
        "2027-03-02 10:15-03:00",
        "2027-02-30T10:15-03:00",
        loyalty_in(-1),
        loyalty_in(1096),
    ],
    ids=["com-segundos", "fuso-z", "sem-T", "data-inexistente", "passado", "acima-de-1095-dias"],
)
def test_b12_loyalty_outside_the_format_or_window_is_400(
    api: httpx2.Client, tubaroes: dict, loyalty_until: str
) -> None:
    player = cheap_player(api, "Fiel Torcedor")

    response = api.post(
        f"/players/{player['id']}/buy",
        json={"club_id": tubaroes["id"], "loyalty_until": loyalty_until},
    )

    assert response.status_code == 400


def test_b12_and_b13_purchase_sequence_up_to_the_cash_limit(api: httpx2.Client) -> None:
    mangue = create_club(api, "Mangue FC", "MFC")
    squad = [
        ("Bruno Tavares", "GOL"),
        ("Felipe Moura", "ZAG"),
        ("Diego Ramos", "LAT"),
        ("Ana Meia", "MEI"),
        ("Caio Meia", "MEI"),
        ("Gil Meia", "MEI"),
        ("Ari Atacante", "ATA"),
    ]
    costs = []
    for name, position in reversed(squad):
        player = create_player(api, name=name, position=position)
        costs.append(-bought(api, player["id"], mangue["id"], days=1094)["cash_change"])

    refused = buy(api, create_player(api, name="Oitavo Craque")["id"], mangue["id"])

    assert refused.status_code == 409
    details = club(api, mangue["id"])
    assert details["cash"] == round(300 - sum(costs), 2)
    assert [player["name"] for player in details["players"]] == [name for name, _ in squad]
    for player in details["players"]:
        assert player["contract"]["remaining_days"] == 1094
        assert player["contract"]["penalty_rate"] == 20


@pytest.mark.parametrize(("days", "rate"), [(20, 5), (100, 10), (400, 20)])
def test_b14_penalty_rate_by_remaining_days(
    api: httpx2.Client, tubaroes: dict, days: int, rate: int
) -> None:
    player = create_player(api, name="Multa Prevista")
    bought(api, player["id"], tubaroes["id"], days=days)

    contract = next(
        item["contract"]
        for item in club(api, tubaroes["id"])["players"]
        if item["id"] == player["id"]
    )
    sale = api.post(f"/players/{player['id']}/sell").json()

    assert (contract["remaining_days"], contract["penalty_rate"]) == (days, rate)
    assert sale["penalty_rate"] == rate
    assert sale["penalty"] == min(round(40 * rate / 100, 2), 10.0)
    assert sale["contract_status"] == "RESCINDIDO"


def test_b15_sale_with_profit_commission_and_credit(api: httpx2.Client, tubaroes: dict) -> None:
    player = create_player(api, name="Lucro Certo")
    api.patch(f"/players/{player['id']}/condition", json={"condition": "MAL_CONDICIONADO"})
    bought(api, player["id"], tubaroes["id"], days=400)
    api.patch(f"/players/{player['id']}/condition", json={"condition": "APTO"})
    cash_before = club(api, tubaroes["id"])["cash"]

    sale = api.post(f"/players/{player['id']}/sell").json()

    assert (sale["type"], sale["value"], sale["purchase_value"]) == ("VENDA", 40.0, 37.0)
    assert (sale["profit"], sale["fee"], sale["penalty"]) == (3.0, 0.3, 8.0)
    assert sale["cash_change"] == 31.7
    assert sale["club_cash"] == round(cash_before + 31.7, 2)
    assert api.get(f"/players/{player['id']}").json()["club_id"] is None


def test_b15_sale_at_a_loss_has_no_commission(api: httpx2.Client, tubaroes: dict) -> None:
    player = create_player(api, name="Prejuízo Certo")
    bought(api, player["id"], tubaroes["id"], days=20)
    api.patch(f"/players/{player['id']}/condition", json={"condition": "MAL_CONDICIONADO"})

    sale = api.post(f"/players/{player['id']}/sell").json()

    assert (sale["value"], sale["profit"], sale["fee"]) == (37.0, -3.0, 0.0)
    assert (sale["penalty"], sale["cash_change"]) == (1.85, 35.15)


def test_b16_sale_refusals_and_buy_back(api: httpx2.Client, tubaroes: dict) -> None:
    albatroz = next(item for item in api.get("/clubs").json() if item["name"] == "Albatroz EC")
    player = create_player(api, name="Volta Logo")
    bought(api, player["id"], tubaroes["id"])
    api.post(f"/players/{player['id']}/sell")
    deleted = cheap_player(api, "Nunca Mais")
    api.delete(f"/players/{deleted['id']}")

    assert api.post(f"/players/{player['id']}/sell").status_code == 409
    assert api.post(f"/players/{deleted['id']}/sell").status_code == 404
    assert buy(api, player["id"], tubaroes["id"]).status_code == 409
    assert buy(api, player["id"], albatroz["id"]).status_code == 200


def test_b17_net_worth_order_filters_and_club_rules(api: httpx2.Client, tubaroes: dict) -> None:
    by_net_worth = api.get("/clubs?sort=net_worth_desc").json()
    in_club = api.get(f"/players?club_id={tubaroes['id']}&limit=50").json()["data"]
    with_club = api.get("/players?free=false&limit=50").json()["data"]
    member = in_club[0]

    net_worths = [item["net_worth"] for item in by_net_worth]
    assert net_worths == sorted(net_worths, reverse=True)
    assert api.get("/clubs?sort=patrimonio").status_code == 400
    assert {player["club_id"] for player in in_club} == {tubaroes["id"]}
    assert all(player["club_id"] is not None for player in with_club)
    assert api.delete(f"/players/{member['id']}").status_code == 409
    moved = api.put(
        f"/players/{member['id']}",
        json={"name": member["name"], "position": "GOL", "agility": 70, "age": member["age"]},
    )
    assert moved.status_code == 409
