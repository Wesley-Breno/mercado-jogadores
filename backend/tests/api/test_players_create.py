import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine

from tests.conftest import count_rows

PLAYERS_URL = "/api/v1/players"
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
REQUIRED_FIELDS = list(MEIA_LUA)


def payload(**changes: object) -> dict:
    return {**MEIA_LUA, **changes}


def without(field: str) -> dict:
    return {key: value for key, value in MEIA_LUA.items() if key != field}


def test_creates_player_with_location_and_calculated_values(client: TestClient) -> None:
    response = client.post(PLAYERS_URL, json=MEIA_LUA)

    assert response.status_code == 201
    assert response.headers["location"] == "/api/v1/players/1"
    assert response.json() == {
        "id": 1,
        **MEIA_LUA,
        "condition": "APTO",
        "base_value": 40.0,
        "market_value": 40.0,
        "overall": 75,
        "club_id": None,
    }


def test_get_returns_the_registered_player(client: TestClient) -> None:
    created = client.post(PLAYERS_URL, json=MEIA_LUA).json()

    response = client.get(f"{PLAYERS_URL}/{created['id']}")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == created


def test_fields_controlled_by_the_system_are_ignored(client: TestClient) -> None:
    sent = payload(
        id=99,
        base_value=999.99,
        market_value=1,
        overall=1,
        condition="DOENTE",
        club_id=5,
        unknown_field="x",
    )

    body = client.post(PLAYERS_URL, json=sent).json()

    assert (body["id"], body["base_value"], body["market_value"]) == (1, 40.0, 40.0)
    assert (body["overall"], body["condition"], body["club_id"]) == (75, "APTO", None)


def test_name_is_saved_after_v4(client: TestClient) -> None:
    body = client.post(PLAYERS_URL, json=payload(name="  Meia   Lua ")).json()

    assert body["name"] == "Meia Lua"


def test_integer_with_zero_fraction_is_accepted(client: TestClient) -> None:
    response = client.post(PLAYERS_URL, json=payload(agility=85.0, age=25.0))

    assert response.status_code == 201
    assert (response.json()["agility"], response.json()["age"]) == (85, 25)


@pytest.mark.parametrize(
    "changes",
    [
        {"name": "A B"},
        {"name": "Ana " + "x" * 96},
        {"age": 16},
        {"age": 45, "agility": 85, "potential": 82},
        {"age": 33, "potential": 82},
        {"age": 35, "agility": 85, "potential": 82},
        {"agility": 1},
        {"agility": 100},
        {
            "pace": 99,
            "shooting": 99,
            "passing": 99,
            "dribbling": 99,
            "defending": 83,
            "physical": 1,
            "potential": 99,
        },
        {"potential": 82},
    ],
    ids=[
        "nome-3-caracteres",
        "nome-100-caracteres",
        "idade-16",
        "idade-45",
        "idade-33-potencial-igual-ao-maior",
        "idade-35-agilidade-85",
        "agilidade-1",
        "agilidade-100",
        "soma-480",
        "potencial-igual-ao-maior",
    ],
)
def test_limits_are_inclusive(client: TestClient, changes: dict) -> None:
    assert client.post(PLAYERS_URL, json=payload(**changes)).status_code == 201


INVALID_PAYLOADS = {
    **{f"sem-{field}": without(field) for field in REQUIRED_FIELDS},
    **{f"{field}-nulo": payload(**{field: None}) for field in REQUIRED_FIELDS},
    "Agility-em-vez-de-agility": {**without("agility"), "Agility": 85},
    "inteiro-como-texto": payload(agility="85"),
    "inteiro-booleano": payload(agility=True),
    "inteiro-com-fracao": payload(agility=85.5),
    "posicao-minuscula": payload(position="mei"),
    "posicao-fora-da-lista": payload(position="PON"),
    "nome-numero": payload(name=12),
    "nome-uma-palavra": payload(name="Meia"),
    "nome-curto": payload(name="Jo"),
    "nome-com-digito": payload(name="Meia Lua 2"),
    "nome-com-tabulacao": payload(name="Meia\tLua"),
    "nome-vazio-depois-da-v4": payload(name="    "),
    "nome-101-caracteres": payload(name="Ana " + "x" * 97),
    "agilidade-0": payload(agility=0),
    "agilidade-101": payload(agility=101),
    "idade-15": payload(age=15),
    "idade-46": payload(age=46),
    "atributo-0": payload(pace=0),
    "atributo-100": payload(pace=100),
    "potencial-100": payload(potential=100),
    "soma-481": payload(
        pace=99, shooting=99, passing=99, dribbling=99, defending=84, physical=1, potential=99
    ),
    "potencial-menor-que-o-maior": payload(potential=81),
    "idade-33-potencial-diferente": payload(age=33),
    "idade-35-agilidade-86": payload(age=35, agility=86, potential=82),
    "corpo-array": [MEIA_LUA],
}


@pytest.mark.parametrize("body", INVALID_PAYLOADS.values(), ids=INVALID_PAYLOADS.keys())
def test_invalid_registration_is_400_and_saves_nothing(
    client: TestClient, engine: Engine, body: object
) -> None:
    response = client.post(PLAYERS_URL, json=body)

    assert response.status_code == 400
    assert response.json()["message"]
    assert count_rows(engine, "jogadores") == 0


@pytest.mark.parametrize(
    "raw_id", ["999", "abc", "0", "-1", "01", "1.5", "2147483648", "2147483647"]
)
def test_player_id_that_does_not_exist_is_404(client: TestClient, raw_id: str) -> None:
    client.post(PLAYERS_URL, json=MEIA_LUA)

    response = client.get(f"{PLAYERS_URL}/{raw_id}")

    assert response.status_code == 404
    assert response.json()["message"]
