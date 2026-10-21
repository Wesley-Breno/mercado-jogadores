"""B01 to B08: registration, conventions, editing, condition, player values, listing, deletion."""

import httpx2
import pytest

from conformance.support import MEIA_LUA, create_player

INVALID_BODIES = {
    "corpo-array": [MEIA_LUA],
    "sem-agility": {key: value for key, value in MEIA_LUA.items() if key != "agility"},
    "Agility-camelcase": {
        **{key: value for key, value in MEIA_LUA.items() if key != "agility"},
        "Agility": 85,
    },
    "agility-nulo": {**MEIA_LUA, "agility": None},
    "idade-texto": {**MEIA_LUA, "age": "25"},
    "idade-fracionaria": {**MEIA_LUA, "age": 25.5},
    "idade-booleana": {**MEIA_LUA, "age": True},
    "idade-15": {**MEIA_LUA, "age": 15},
    "posicao-minuscula": {**MEIA_LUA, "position": "mei"},
    "nome-com-digito": {**MEIA_LUA, "name": "Meia Lua 2"},
    "nome-uma-palavra": {**MEIA_LUA, "name": "Meialua"},
    "nome-so-espacos": {**MEIA_LUA, "name": "   "},
    "atributo-100": {**MEIA_LUA, "pace": 100},
    "soma-acima-de-480": {**MEIA_LUA, "pace": 99, "shooting": 99, "passing": 99, "dribbling": 99},
    "potencial-abaixo-do-maior-atributo": {**MEIA_LUA, "potential": 80},
}


@pytest.mark.parametrize("body", INVALID_BODIES.values(), ids=INVALID_BODIES.keys())
def test_b01_invalid_registration_is_400_with_message(api: httpx2.Client, body: object) -> None:
    response = api.post("/players", json=body)

    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert response.json()["message"]


def test_b01_name_is_saved_after_v4(api: httpx2.Client) -> None:
    assert create_player(api, name="  Lua   Nova ")["name"] == "Lua Nova"


@pytest.mark.parametrize(
    ("request_args", "status"),
    [
        ({"method": "POST", "url": "/players", "content": "{oops"}, 400),
        ({"method": "GET", "url": "/inexistente"}, 404),
        ({"method": "GET", "url": "/players/abc"}, 404),
        ({"method": "GET", "url": "/players/01"}, 404),
        ({"method": "GET", "url": "/players/2147483648"}, 404),
        ({"method": "GET", "url": "/players/"}, 404),
    ],
    ids=["json-invalido", "caminho", "id-texto", "id-com-zero", "id-grande", "barra-final"],
)
def test_b02_error_codes_always_with_message(
    api: httpx2.Client, request_args: dict, status: int
) -> None:
    headers = {"Content-Type": "application/json"} if "content" in request_args else None
    response = api.request(**request_args, headers=headers)

    assert response.status_code == status
    assert response.json()["message"]


def test_b03_system_fields_are_ignored_and_location_points_to_the_player(
    api: httpx2.Client,
) -> None:
    response = api.post(
        "/players", json={**MEIA_LUA, "base_value": 999, "overall": 1, "condition": "DOENTE"}
    )

    assert response.status_code == 201
    body = response.json()
    assert response.headers["location"].endswith(f"/api/v1/players/{body['id']}")
    assert (body["base_value"], body["market_value"], body["overall"]) == (40.0, 40.0, 75)
    assert (body["condition"], body["club_id"]) == ("APTO", None)
    assert api.get(f"/players/{body['id']}").json() == body


def test_b03_and_b04_put_changes_four_fields_and_never_the_base_value(api: httpx2.Client) -> None:
    player = create_player(api)

    response = api.put(
        f"/players/{player['id']}",
        json={"name": "Meia Lua Neto", "position": "ATA", "agility": 80, "age": 26, "pace": 10},
    )

    body = response.json()
    assert response.status_code == 200
    assert (body["name"], body["position"], body["agility"], body["age"]) == (
        "Meia Lua Neto",
        "ATA",
        80,
        26,
    )
    assert (body["base_value"], body["pace"]) == (40.0, 70)
    assert api.put(f"/players/{player['id']}", json={**MEIA_LUA, "age": 24}).status_code == 409
    assert api.put(f"/players/{player['id']}", json={"name": "Só Nome"}).status_code == 400


def test_b04_and_b05_condition_changes_the_market_value(api: httpx2.Client) -> None:
    player = create_player(api)
    url = f"/players/{player['id']}/condition"

    unfit = api.patch(url, json={"condition": "MAL_CONDICIONADO"}).json()
    same = api.patch(url, json={"condition": "MAL_CONDICIONADO"})
    sick = api.patch(url, json={"condition": "DOENTE"}).json()

    assert unfit["market_value"] == 37.0
    assert same.status_code == 200
    assert sick["market_value"] == 34.0
    assert api.patch(url, json={"condition": "APTO"}).status_code == 409
    assert api.patch(url, json={"condition": "apto"}).status_code == 400
    assert api.patch(url, json={"condition": "MAL_CONDICIONADO"}).json()["market_value"] == 37.0


def test_b05_age_changes_the_market_value(api: httpx2.Client) -> None:
    player = create_player(api, name="Lobo Velho", agility=60)

    older = api.put(
        f"/players/{player['id']}",
        json={"name": "Lobo Velho", "position": "MEI", "agility": 60, "age": 32},
    ).json()

    assert older["market_value"] == 36.0


def test_b06_young_prospect_gets_the_potential_bonus(api: httpx2.Client) -> None:
    young = create_player(api, name="Jovem Promessa", age=20)

    assert (young["overall"], young["base_value"], young["market_value"]) == (75, 44.4, 48.84)


def test_b07_listing_search_filters_order_and_pagination(api: httpx2.Client) -> None:
    create_player(api, name="Ícaro Mendes", position="ATA", age=30)

    found = api.get("/players?search=icaro&position=ATA&free=true&min_age=30&max_age=30").json()
    by_value = api.get("/players?sort=value_desc&limit=2&page=1").json()
    beyond = api.get("/players?page=999").json()

    assert [player["name"] for player in found["data"]] == ["Ícaro Mendes"]
    assert by_value["meta"]["limit"] == 2
    values = [player["market_value"] for player in by_value["data"]]
    assert values == sorted(values, reverse=True)
    assert beyond["data"] == []
    for query in ("limit=51", "sort=value_asc,value_desc", "position=", "min_age=40&max_age=30"):
        assert api.get(f"/players?{query}").status_code == 400, query


def test_b08_deleted_player_no_longer_exists(api: httpx2.Client) -> None:
    player = create_player(api, name="Zé Excluído")
    url = f"/players/{player['id']}"

    deleted = api.delete(url)

    assert (deleted.status_code, deleted.content) == (204, b"")
    assert api.get(url).status_code == 404
    assert (
        api.put(
            url, json={"name": "Zé Outro", "position": "MEI", "agility": 50, "age": 30}
        ).status_code
        == 404
    )
    assert api.patch(f"{url}/condition", json={"condition": "DOENTE"}).status_code == 404
    assert api.delete(url).status_code == 404
    names = [p["name"] for p in api.get("/players?search=excluido").json()["data"]]
    assert "Zé Excluído" not in names
