import pytest
from fastapi.testclient import TestClient

from tests.api.test_players_create import MEIA_LUA, PLAYERS_URL

# Market values (APTO, agility 85): João 40.00, Meia 48.84 (19 years), Ana-Maria 34.00,
# Ana Lima 18.00 (34 years), Épsilon 16.00.
DATASET = [
    {"name": "João Silva", "position": "MEI", "age": 25},
    {"name": "Meia Lua", "position": "MEI", "age": 19},
    {"name": "Ana-Maria Costa", "position": "ATA", "age": 30},
    {"name": "Ana Lima", "position": "GOL", "age": 34, "potential": 82},
    {"name": "Épsilon Rocha", "position": "ZAG", "age": 22},
]
BY_NAME = ["Ana Lima", "Ana-Maria Costa", "Épsilon Rocha", "João Silva", "Meia Lua"]


@pytest.fixture
def league(client: TestClient) -> TestClient:
    for changes in DATASET:
        assert client.post(PLAYERS_URL, json={**MEIA_LUA, **changes}).status_code == 201
    return client


def names(client: TestClient, query: str) -> list[str]:
    response = client.get(f"{PLAYERS_URL}?{query}")
    assert response.status_code == 200, response.json()
    return [player["name"] for player in response.json()["data"]]


def test_default_list_is_ordered_by_name_with_meta(league: TestClient) -> None:
    body = league.get(PLAYERS_URL).json()

    assert [player["name"] for player in body["data"]] == BY_NAME
    assert body["meta"] == {"page": 1, "limit": 10, "total_items": 5, "total_pages": 1}
    assert body["data"][0]["market_value"] == 18.0


def test_empty_list_is_200_with_zeroed_meta(client: TestClient) -> None:
    response = client.get(PLAYERS_URL)

    assert response.status_code == 200
    assert response.json() == {
        "data": [],
        "meta": {"page": 1, "limit": 10, "total_items": 0, "total_pages": 0},
    }


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("search=joao", ["João Silva"]),
        ("search=LUA", ["Meia Lua"]),
        ("search=ana", ["Ana Lima", "Ana-Maria Costa"]),
        ("search=a%20l", ["Ana Lima", "Meia Lua"]),
        ("search=epsilon", ["Épsilon Rocha"]),
        ("position=MEI", ["João Silva", "Meia Lua"]),
        ("condition=APTO", BY_NAME),
        ("condition=DOENTE", []),
        ("free=true", BY_NAME),
        ("free=false", []),
        ("min_age=25", ["Ana Lima", "Ana-Maria Costa", "João Silva"]),
        ("max_age=22", ["Épsilon Rocha", "Meia Lua"]),
        ("min_age=22&max_age=25", ["Épsilon Rocha", "João Silva"]),
        ("min_value=20", ["Ana-Maria Costa", "João Silva", "Meia Lua"]),
        ("max_value=18", ["Ana Lima", "Épsilon Rocha"]),
        ("min_value=34&max_value=40", ["Ana-Maria Costa", "João Silva"]),
        ("min_value=48.84", ["Meia Lua"]),
        ("min_value=0.5&max_value=16", ["Épsilon Rocha"]),
        ("position=MEI&min_age=20", ["João Silva"]),
        ("search=an&position=ATA", ["Ana-Maria Costa"]),
        ("unknown=1", BY_NAME),
    ],
)
def test_search_and_filters_combine(league: TestClient, query: str, expected: list[str]) -> None:
    assert names(league, query) == expected


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        ("name", BY_NAME),
        (
            "value_desc",
            ["Meia Lua", "João Silva", "Ana-Maria Costa", "Ana Lima", "Épsilon Rocha"],
        ),
        ("value_asc", ["Épsilon Rocha", "Ana Lima", "Ana-Maria Costa", "João Silva", "Meia Lua"]),
        ("age_asc", ["Meia Lua", "Épsilon Rocha", "João Silva", "Ana-Maria Costa", "Ana Lima"]),
        ("age_desc", ["Ana Lima", "Ana-Maria Costa", "João Silva", "Épsilon Rocha", "Meia Lua"]),
        ("position", ["Ana Lima", "Épsilon Rocha", "João Silva", "Meia Lua", "Ana-Maria Costa"]),
        (
            "position,value_desc",
            ["Ana Lima", "Épsilon Rocha", "Meia Lua", "João Silva", "Ana-Maria Costa"],
        ),
    ],
)
def test_sort_criteria(league: TestClient, sort: str, expected: list[str]) -> None:
    assert names(league, f"sort={sort}") == expected


def test_ties_are_broken_by_name_and_then_id(client: TestClient) -> None:
    for name in ["Zé Pedro", "Bia Souza", "Zé Pedro"]:
        client.post(PLAYERS_URL, json={**MEIA_LUA, "name": name})

    data = client.get(f"{PLAYERS_URL}?sort=age_asc").json()["data"]

    assert [(player["name"], player["id"]) for player in data] == [
        ("Bia Souza", 2),
        ("Zé Pedro", 1),
        ("Zé Pedro", 3),
    ]


@pytest.mark.parametrize(
    ("query", "expected", "meta"),
    [
        ("limit=2", BY_NAME[:2], (1, 2, 5, 3)),
        ("limit=2&page=3", BY_NAME[4:], (3, 2, 5, 3)),
        ("limit=2&page=4", [], (4, 2, 5, 3)),
        ("limit=50", BY_NAME, (1, 50, 5, 1)),
        ("position=MEI&limit=1&page=2", ["Meia Lua"], (2, 1, 2, 2)),
    ],
)
def test_pagination_happens_after_filters_and_sort(
    league: TestClient, query: str, expected: list[str], meta: tuple[int, int, int, int]
) -> None:
    body = league.get(f"{PLAYERS_URL}?{query}").json()

    assert [player["name"] for player in body["data"]] == expected
    assert tuple(body["meta"].values()) == meta


def test_nonexistent_club_filter_is_404(client: TestClient) -> None:
    response = client.get(f"{PLAYERS_URL}?club_id=1")

    assert response.status_code == 404
    assert response.json()["message"]


INVALID_QUERIES = [
    "position=mei",
    "position=",
    "condition=apto",
    "free=TRUE",
    "free=1",
    "free=",
    "club_id=0",
    "club_id=-1",
    "club_id=abc",
    "free=true&club_id=1",
    "min_age=15",
    "max_age=46",
    "min_age=abc",
    "min_age=016",
    "min_age=%2B20",
    "min_age=20.0",
    "min_age=",
    "min_age=30&max_age=20",
    "min_value=-1",
    "min_value=551",
    "max_value=550.01",
    "min_value=10.555",
    "min_value=1e2",
    "min_value=01",
    "min_value=10,5",
    "min_value=.5",
    "min_value=",
    "min_value=40&max_value=30",
    "sort=POSITION",
    "sort=value_asc,value_desc",
    "sort=name,name",
    "sort=name,age_asc,value_desc",
    "sort=name,%20age_asc",
    "sort=name,",
    "sort=",
    "page=0",
    "page=-1",
    "page=1.5",
    "page=",
    "limit=0",
    "limit=51",
    "limit=abc",
    "search=a",
    "search=",
    "search=%20%20%20",
    "search=Meia%09Lua",
    f"search={'x' * 101}",
]


@pytest.mark.parametrize("query", INVALID_QUERIES)
def test_invalid_or_contradictory_params_are_400(client: TestClient, query: str) -> None:
    response = client.get(f"{PLAYERS_URL}?{query}")

    assert response.status_code == 400
    assert response.json()["message"]


@pytest.mark.parametrize(
    "query", ["min_value=0", "max_value=550", "max_value=550.00", "search=ab", "free=false"]
)
def test_valid_edge_params_are_accepted(client: TestClient, query: str) -> None:
    assert client.get(f"{PLAYERS_URL}?{query}").status_code == 200
