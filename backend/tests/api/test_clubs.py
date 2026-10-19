from collections.abc import Callable
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text

from app.core.clock import BRASILIA_TZ
from tests.api.test_players_create import MEIA_LUA, PLAYERS_URL
from tests.conftest import count_rows

CLUBS_URL = "/api/v1/clubs"
AGUIAS = {"name": "Águias FC", "acronym": "AGU"}
NOW = datetime(2026, 11, 2, 10, 15, tzinfo=BRASILIA_TZ)


def create_club(client: TestClient, name: str, acronym: str) -> int:
    response = client.post(CLUBS_URL, json={"name": name, "acronym": acronym})
    assert response.status_code == 201, response.json()
    return response.json()["id"]


def create_player(client: TestClient, **changes: object) -> int:
    response = client.post(PLAYERS_URL, json={**MEIA_LUA, **changes})
    assert response.status_code == 201, response.json()
    return response.json()["id"]


def sign(engine: Engine, club_id: int, player_id: int, loyalty_until: str) -> None:
    """Puts a player in the squad with an ATIVO contract straight in the database."""
    with engine.begin() as connection:
        connection.execute(
            text("UPDATE jogadores SET clube_id = :club WHERE id = :player"),
            {"club": club_id, "player": player_id},
        )
        connection.execute(
            text(
                "INSERT INTO contratos (jogador_id, clube_id, valor_compra, fidelidade_ate,"
                " situacao, iniciado_em) VALUES (:player, :club, 37.00, :until, 'ATIVO', now())"
            ),
            {"player": player_id, "club": club_id, "until": loyalty_until},
        )


def set_cash(engine: Engine, club_id: int, cash: str) -> None:
    with engine.begin() as connection:
        connection.execute(
            text("UPDATE clubes SET caixa = :cash WHERE id = :club"),
            {"cash": cash, "club": club_id},
        )


def test_creates_club_with_location_and_300_in_cash(client: TestClient) -> None:
    response = client.post(CLUBS_URL, json={**AGUIAS, "cash": 1000, "id": 9})

    assert response.status_code == 201
    assert response.headers["location"] == "/api/v1/clubs/1"
    assert response.json() == {
        "id": 1,
        "name": "Águias FC",
        "acronym": "AGU",
        "cash": 300.0,
        "squad_value": 0.0,
        "net_worth": 300.0,
    }
    assert client.get(f"{CLUBS_URL}/1").json()["players"] == []


def test_club_name_is_saved_after_v4(client: TestClient) -> None:
    body = client.post(CLUBS_URL, json={"name": "  Águias   FC ", "acronym": "AGU"}).json()

    assert body["name"] == "Águias FC"


def test_name_is_unique_ignoring_case_but_not_accents(client: TestClient) -> None:
    create_club(client, **AGUIAS)

    repeated = client.post(CLUBS_URL, json={"name": "  águias   fc ", "acronym": "AGF"})
    without_accent = client.post(CLUBS_URL, json={"name": "Aguias FC", "acronym": "AGI"})

    assert repeated.status_code == 409
    assert repeated.json()["message"]
    assert without_accent.status_code == 201


def test_acronym_is_unique(client: TestClient, engine: Engine) -> None:
    create_club(client, **AGUIAS)

    response = client.post(CLUBS_URL, json={"name": "Aguerridos do Norte", "acronym": "AGU"})

    assert response.status_code == 409
    assert count_rows(engine, "clubes") == 1


def test_league_accepts_at_most_20_clubs(client: TestClient, engine: Engine) -> None:
    for letter in "BCDEFGHIJKLMNOPQRSTU":
        create_club(client, f"Clube A{letter.lower()}", f"CA{letter}")

    response = client.post(CLUBS_URL, json={"name": "Clube Az", "acronym": "CAZ"})

    assert response.status_code == 409
    assert response.json()["message"]
    assert count_rows(engine, "clubes") == 20


INVALID_CLUBS = {
    "nome-curto": {"name": "A B", "acronym": "ABX"},
    "nome-uma-palavra": {"name": "Águias", "acronym": "AGU"},
    "nome-seis-palavras": {"name": "Clube Dos Amigos Do Bairro Alto", "acronym": "CDA"},
    "nome-61-caracteres": {"name": "Clube " + "a" * 55, "acronym": "CLU"},
    "nome-com-digito": {"name": "Clube 2000", "acronym": "CLU"},
    "nome-com-simbolo": {"name": "Clube & Cia", "acronym": "CLU"},
    "nome-com-quebra-de-linha": {"name": "Águias\nFC", "acronym": "AGU"},
    "nome-vazio": {"name": "   ", "acronym": "AGU"},
    "nome-nulo": {"name": None, "acronym": "AGU"},
    "sem-sigla": {"name": "Águias FC"},
    "sigla-minuscula": {"name": "Águias FC", "acronym": "agu"},
    "sigla-com-acento": {"name": "Águias FC", "acronym": "ÁGU"},
    "sigla-duas-letras": {"name": "Águias FC", "acronym": "AG"},
    "sigla-quatro-letras": {"name": "Águias FC", "acronym": "AGUI"},
    "sigla-letras-iguais": {"name": "Aaa Aaa", "acronym": "AAA"},
    "sigla-fora-da-ordem": {"name": "Delta FC", "acronym": "DCF"},
    "sigla-nao-comeca-pelo-nome": {"name": "Águias FC", "acronym": "GUA"},
    "sigla-numero": {"name": "Águias FC", "acronym": 123},
    "corpo-array": [AGUIAS],
}


@pytest.mark.parametrize("body", INVALID_CLUBS.values(), ids=INVALID_CLUBS.keys())
def test_invalid_club_is_400_and_saves_nothing(
    client: TestClient, engine: Engine, body: object
) -> None:
    response = client.post(CLUBS_URL, json=body)

    assert response.status_code == 400
    assert response.json()["message"]
    assert count_rows(engine, "clubes") == 0


@pytest.mark.parametrize(
    "body",
    [
        {"name": "Ana B", "acronym": "ANB"},
        {"name": "Clube " + "a" * 54, "acronym": "CLU"},
        {"name": "Um Dois Tres Quatro Cinco", "acronym": "UDT"},
        {"name": "São-Paulo F.C.", "acronym": "SPF"},
    ],
    ids=["nome-5-caracteres", "nome-60-caracteres", "nome-5-palavras", "hifen-e-ponto"],
)
def test_valid_edge_names(client: TestClient, body: dict) -> None:
    assert client.post(CLUBS_URL, json=body).status_code == 201


def test_list_is_ordered_by_name_by_default(client: TestClient) -> None:
    create_club(client, "Delta FC", "DFC")
    create_club(client, "Épsilon EC", "EEC")
    create_club(client, "Águias FC", "AFC")

    body = client.get(CLUBS_URL).json()

    assert [club["name"] for club in body] == ["Águias FC", "Delta FC", "Épsilon EC"]
    assert set(body[0]) == {"id", "name", "acronym", "cash", "squad_value", "net_worth"}


def test_empty_list_is_200(client: TestClient) -> None:
    response = client.get(CLUBS_URL)

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        ("name", ["Águias FC", "Delta FC", "Gama SC"]),
        ("net_worth_desc", ["Águias FC", "Gama SC", "Delta FC"]),
        ("net_worth_asc", ["Delta FC", "Águias FC", "Gama SC"]),
    ],
)
def test_list_by_net_worth_breaks_ties_by_name(
    client: TestClient, engine: Engine, sort: str, expected: list[str]
) -> None:
    gama = create_club(client, "Gama SC", "GSC")
    delta = create_club(client, "Delta FC", "DFC")
    create_club(client, "Águias FC", "AFC")
    set_cash(engine, delta, "250.00")
    set_cash(engine, gama, "260.00")
    sign(engine, gama, create_player(client), "2027-01-01T10:00-03:00")

    body = client.get(f"{CLUBS_URL}?sort={sort}").json()

    assert [club["name"] for club in body] == expected
    assert [club["net_worth"] for club in body if club["name"] == "Gama SC"] == [300.0]


@pytest.mark.parametrize(
    "sort", ["NAME", "net_worth", "name,net_worth_desc", "", "net_worth_desc,name"]
)
def test_invalid_club_sort_is_400(client: TestClient, sort: str) -> None:
    assert client.get(f"{CLUBS_URL}?sort={sort}").status_code == 400


def test_club_page_shows_squad_in_order_with_contracts_and_values(
    client: TestClient, engine: Engine, freeze_clock: Callable[[datetime], None]
) -> None:
    freeze_clock(NOW)
    club_id = create_club(client, **AGUIAS)
    set_cash(engine, club_id, "261.15")
    meia_lua = create_player(client)
    client.patch(f"{PLAYERS_URL}/{meia_lua}/condition", json={"condition": "MAL_CONDICIONADO"})
    signings = [
        (meia_lua, "2027-03-02T10:15-03:00"),
        (create_player(client, name="Otto Rangel", position="ATA"), "2026-12-02T10:15-03:00"),
        (create_player(client, name="Ana Meia"), "2027-06-01T10:15-03:00"),
        (create_player(client, name="Téo Brandão", position="ZAG"), "2026-11-12T12:15-03:00"),
        (create_player(client, name="Rui Prado", position="GOL"), "2026-11-01T10:15-03:00"),
    ]
    for player_id, loyalty_until in signings:
        sign(engine, club_id, player_id, loyalty_until)

    body = client.get(f"{CLUBS_URL}/{club_id}").json()

    assert [
        (player["name"], player["market_value"], *player["contract"].values())
        for player in body["players"]
    ] == [
        ("Rui Prado", 20.0, 37.0, "2026-11-01T10:15:00-03:00", 0, 0),
        ("Téo Brandão", 16.0, 37.0, "2026-11-12T12:15:00-03:00", 11, 5),
        ("Ana Meia", 40.0, 37.0, "2027-06-01T10:15:00-03:00", 211, 20),
        ("Meia Lua", 37.0, 37.0, "2027-03-02T10:15:00-03:00", 120, 10),
        ("Otto Rangel", 34.0, 37.0, "2026-12-02T10:15:00-03:00", 30, 5),
    ]
    assert (body["cash"], body["squad_value"], body["net_worth"]) == (261.15, 147.0, 408.15)
    assert body["players"][3]["club_id"] == club_id
    assert body["players"][3]["condition"] == "MAL_CONDICIONADO"


@pytest.mark.parametrize("raw_id", ["1", "abc", "0", "01", "2147483648"])
def test_nonexistent_club_is_404(client: TestClient, raw_id: str) -> None:
    response = client.get(f"{CLUBS_URL}/{raw_id}")

    assert response.status_code == 404
    assert response.json()["message"]


def test_player_list_filters_by_club(client: TestClient, engine: Engine) -> None:
    club_id = create_club(client, **AGUIAS)
    signed = create_player(client, name="Rui Prado")
    create_player(client, name="Zé Livre")
    sign(engine, club_id, signed, "2027-01-01T10:00-03:00")

    by_club = client.get(f"{PLAYERS_URL}?club_id={club_id}").json()["data"]
    with_club = client.get(f"{PLAYERS_URL}?free=false&club_id={club_id}").json()["data"]
    free = client.get(f"{PLAYERS_URL}?free=true").json()["data"]

    assert [player["name"] for player in by_club] == ["Rui Prado"]
    assert [player["name"] for player in with_club] == ["Rui Prado"]
    assert [player["name"] for player in free] == ["Zé Livre"]
