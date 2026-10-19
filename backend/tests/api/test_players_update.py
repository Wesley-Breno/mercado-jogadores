import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text

from tests.api.test_players_create import MEIA_LUA, PLAYERS_URL
from tests.conftest import count_rows

EDIT = {"name": "Meia Lua", "position": "MEI", "agility": 85, "age": 25}


@pytest.fixture
def player_id(client: TestClient) -> int:
    return client.post(PLAYERS_URL, json=MEIA_LUA).json()["id"]


def put_in_club_lineup(engine: Engine, player_id: int) -> None:
    """Puts the player in a club and in its lineup straight in the database."""
    with engine.begin() as connection:
        club_id = connection.scalar(
            text("INSERT INTO clubes (nome, sigla) VALUES ('Águias FC', 'AGU') RETURNING id")
        )
        connection.execute(
            text("UPDATE jogadores SET clube_id = :club_id WHERE id = :player_id"),
            {"club_id": club_id, "player_id": player_id},
        )
        connection.execute(
            text("INSERT INTO escalacoes (clube_id, jogador_id, criado_em) VALUES (:c, :p, now())"),
            {"c": club_id, "p": player_id},
        )


def player_url(player_id: int | str, suffix: str = "") -> str:
    return f"{PLAYERS_URL}/{player_id}{suffix}"


def test_put_changes_only_the_four_fields_and_keeps_the_base_value(
    client: TestClient, player_id: int
) -> None:
    sent = {
        "name": "  Lua   Nova ",
        "position": "ATA",
        "agility": 50,
        "age": 30,
        "pace": 1,
        "potential": 1,
        "base_value": 1,
        "condition": "DOENTE",
        "club_id": 7,
    }

    response = client.put(player_url(player_id), json=sent)

    assert response.status_code == 200
    body = response.json()
    assert (body["name"], body["position"], body["agility"], body["age"]) == (
        "Lua Nova",
        "ATA",
        50,
        30,
    )
    assert (body["pace"], body["potential"], body["base_value"]) == (70, 86, 40.0)
    assert (body["condition"], body["club_id"]) == ("APTO", None)
    assert body["overall"] == 72
    assert client.get(player_url(player_id)).json() == body


def test_put_to_33_years_or_more_is_accepted_without_changing_potential(
    client: TestClient, player_id: int
) -> None:
    body = client.put(player_url(player_id), json={**EDIT, "age": 33}).json()

    assert (body["age"], body["potential"], body["market_value"]) == (33, 86, 36.0)


@pytest.mark.parametrize("field", list(EDIT))
def test_put_requires_all_four_fields(client: TestClient, player_id: int, field: str) -> None:
    body = {key: value for key, value in EDIT.items() if key != field}

    assert client.put(player_url(player_id), json=body).status_code == 400


@pytest.mark.parametrize(
    "changes",
    [
        {"agility": 86, "age": 35},
        {"agility": "50"},
        {"age": 46},
        {"position": "mei"},
        {"name": "Lua"},
        {"name": None},
    ],
)
def test_put_with_invalid_body_is_400_and_changes_nothing(
    client: TestClient, player_id: int, changes: dict
) -> None:
    response = client.put(player_url(player_id), json={**EDIT, **changes})

    assert response.status_code == 400
    assert client.get(player_url(player_id)).json()["agility"] == 85


def test_age_cannot_decrease(client: TestClient, player_id: int) -> None:
    response = client.put(player_url(player_id), json={**EDIT, "age": 24})

    assert response.status_code == 409
    assert response.json()["message"]
    assert client.get(player_url(player_id)).json()["age"] == 25


def test_player_with_club_keeps_the_position(
    client: TestClient, engine: Engine, player_id: int
) -> None:
    put_in_club_lineup(engine, player_id)

    refused = client.put(player_url(player_id), json={**EDIT, "position": "ATA"})
    same_position = client.put(player_url(player_id), json={**EDIT, "agility": 60})

    assert refused.status_code == 409
    assert same_position.status_code == 200
    assert same_position.json()["position"] == "MEI"


def test_condition_change_recalculates_market_value(client: TestClient, player_id: int) -> None:
    response = client.patch(
        player_url(player_id, "/condition"), json={"condition": "MAL_CONDICIONADO", "name": "X"}
    )

    assert response.status_code == 200
    assert response.json()["condition"] == "MAL_CONDICIONADO"
    assert response.json()["market_value"] == 37.0
    assert response.json()["name"] == "Meia Lua"


@pytest.mark.parametrize(
    ("steps", "final_status", "final_condition"),
    [
        (["APTO"], 200, "APTO"),
        (["DOENTE", "APTO"], 409, "DOENTE"),
        (["DOENTE", "MAL_CONDICIONADO", "APTO"], 200, "APTO"),
        (["DOENTE", "DOENTE"], 200, "DOENTE"),
    ],
    ids=["mesma-condicao", "doente-direto-para-apto", "doente-mal-apto", "doente-de-novo"],
)
def test_condition_transitions(
    client: TestClient,
    player_id: int,
    steps: list[str],
    final_status: int,
    final_condition: str,
) -> None:
    responses = [
        client.patch(player_url(player_id, "/condition"), json={"condition": condition})
        for condition in steps
    ]

    assert responses[-1].status_code == final_status
    assert client.get(player_url(player_id)).json()["condition"] == final_condition


@pytest.mark.parametrize("body", [{}, {"condition": None}, {"condition": "apto"}, {"x": 1}, []])
def test_invalid_condition_body_is_400(client: TestClient, player_id: int, body: object) -> None:
    assert client.patch(player_url(player_id, "/condition"), json=body).status_code == 400


def test_sick_starter_leaves_the_lineup(client: TestClient, engine: Engine, player_id: int) -> None:
    put_in_club_lineup(engine, player_id)

    client.patch(player_url(player_id, "/condition"), json={"condition": "MAL_CONDICIONADO"})
    assert count_rows(engine, "escalacoes") == 1

    client.patch(player_url(player_id, "/condition"), json={"condition": "DOENTE"})
    assert count_rows(engine, "escalacoes") == 0


def test_delete_is_logical_and_the_player_becomes_nonexistent(
    client: TestClient, engine: Engine, player_id: int
) -> None:
    response = client.delete(player_url(player_id))

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(player_url(player_id)).status_code == 404
    assert client.put(player_url(player_id), json=EDIT).status_code == 404
    assert (
        client.patch(player_url(player_id, "/condition"), json={"condition": "APTO"}).status_code
        == 404
    )
    assert client.delete(player_url(player_id)).status_code == 404
    assert client.get(PLAYERS_URL).json()["meta"]["total_items"] == 0
    with engine.connect() as connection:
        deleted_at = connection.scalar(text("SELECT excluido_em FROM jogadores"))
    assert deleted_at is not None


def test_player_with_club_cannot_be_deleted(
    client: TestClient, engine: Engine, player_id: int
) -> None:
    put_in_club_lineup(engine, player_id)

    response = client.delete(player_url(player_id))

    assert response.status_code == 409
    assert response.json()["message"]
    assert client.get(player_url(player_id)).status_code == 200


@pytest.mark.parametrize("raw_id", ["999", "abc", "0", "01"])
def test_edit_condition_and_delete_of_nonexistent_player_are_404(
    client: TestClient, raw_id: str
) -> None:
    assert client.put(player_url(raw_id), json=EDIT).status_code == 404
    assert (
        client.patch(player_url(raw_id, "/condition"), json={"condition": "APTO"}).status_code
        == 404
    )
    assert client.delete(player_url(raw_id)).status_code == 404
