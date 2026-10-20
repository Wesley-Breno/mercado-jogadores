"""B20 a B22: escalação, partida com o exemplo da RN20, histórico de partidas e classificação."""

import re
import unicodedata

import httpx2
import pytest

from conformance.support import bought, cheap_player, club, create_club, create_player

AGUIAS_STARTERS = {
    "Rui Prado": {"position": "GOL", "defending": 77},
    "Téo Brandão": {"position": "ZAG", "defending": 84},
    "Davi Lins": {"position": "LAT", "dribbling": 74, "defending": 66},
    "Lauro Neves": {"position": "MEI", "passing": 82},
    "Otto Rangel": {"position": "ATA", "shooting": 75},
}
DELTA_STARTERS = {
    "Ivo Teles": {"position": "GOL", "defending": 72},
    "Hugo Vaz": {"position": "ZAG", "defending": 84},
    "Lino Matos": {"position": "LAT", "dribbling": 79, "defending": 63},
    "Nei Soares": {"position": "MEI", "passing": 70},
    "Ugo Falcão": {"position": "ATA", "shooting": 81},
}
EXPECTED_DUELS = [
    (1, "Otto Rangel", "shooting", 75, "Ivo Teles", 72, True),
    (2, "Lauro Neves", "passing", 82, "Hugo Vaz", 84, False),
    (3, "Davi Lins", "dribbling", 63, "Lino Matos", 63, False),
    (4, "Ugo Falcão", "shooting", 81, "Rui Prado", 77, True),
    (5, "Nei Soares", "passing", 70, "Téo Brandão", 84, False),
    (6, "Lino Matos", "dribbling", 79, "Davi Lins", 56, True),
]
OUTPUT_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$")


def build_team(api: httpx2.Client, name: str, acronym: str, starters: dict) -> dict:
    team = create_club(api, name, acronym)
    ids = {}
    for player_name, changes in starters.items():
        ids[player_name] = create_player(api, name=player_name, **changes)["id"]
        bought(api, ids[player_name], team["id"])
    response = api.put(
        f"/clubs/{team['id']}/lineup",
        json={"formation": "2-1-1", "player_ids": list(reversed(ids.values()))},
    )
    assert response.status_code == 200, response.text
    return {**team, "players": ids}


@pytest.fixture(scope="module")
def league(api: httpx2.Client) -> dict:
    """The RN20 scenario: Águias FC and Delta FC in the 2-1-1, Davi Lins MAL_CONDICIONADO."""
    aguias = build_team(api, "Águias FC", "AGU", AGUIAS_STARTERS)
    delta = build_team(api, "Delta FC", "DFC", DELTA_STARTERS)
    api.patch(
        f"/players/{aguias['players']['Davi Lins']}/condition",
        json={"condition": "MAL_CONDICIONADO"},
    )
    corujas = create_club(api, "Corujas FC", "CFC")
    return {"aguias": aguias, "delta": delta, "corujas": corujas}


def lineup_url(club_id: int) -> str:
    return f"/clubs/{club_id}/lineup"


def test_b20_lineup_in_squad_order_and_without_lineup(api: httpx2.Client, league: dict) -> None:
    lineup = api.get(lineup_url(league["aguias"]["id"])).json()
    empty = api.get(lineup_url(league["corujas"]["id"])).json()

    assert (lineup["formation"], lineup["complete"]) == ("2-1-1", True)
    assert [player["name"] for player in lineup["players"]] == list(AGUIAS_STARTERS)
    assert empty == {
        "club_id": league["corujas"]["id"],
        "formation": None,
        "complete": False,
        "players": [],
    }


def test_b20_lineup_refusals_change_nothing(api: httpx2.Client, league: dict) -> None:
    aguias, delta = league["aguias"], league["delta"]
    starters = list(aguias["players"].values())
    sick = cheap_player(api, "Reserva Doente")
    bought(api, sick["id"], aguias["id"])
    api.patch(f"/players/{sick['id']}/condition", json={"condition": "DOENTE"})
    url = lineup_url(aguias["id"])
    cases = [
        ({"formation": "4-4-2", "player_ids": starters}, 400),
        ({"formation": "2-1-1", "player_ids": starters[:4]}, 400),
        ({"formation": "2-1-1", "player_ids": [*starters[:4], starters[0]]}, 400),
        ({"formation": "2-1-1", "player_ids": [*starters[:4], 99999]}, 404),
        (
            {"formation": "2-1-1", "player_ids": [*starters[:4], delta["players"]["Ugo Falcão"]]},
            409,
        ),
        ({"formation": "2-1-1", "player_ids": [*starters[:4], sick["id"]]}, 409),
        ({"formation": "3-1", "player_ids": starters}, 409),
    ]

    for body, status in cases:
        assert api.put(url, json=body).status_code == status, body
    assert (
        api.put(lineup_url(99999), json={"formation": "2-1-1", "player_ids": starters}).status_code
        == 404
    )
    assert api.get(url).json()["complete"] is True


def test_b21_match_follows_the_example_of_the_statement(api: httpx2.Client, league: dict) -> None:
    aguias, delta = league["aguias"], league["delta"]
    cash_before = club(api, aguias["id"])["cash"]

    response = api.post(
        "/matches", json={"home_club_id": aguias["id"], "away_club_id": delta["id"]}
    )

    body = response.json()
    assert response.status_code == 201
    assert response.headers["location"].endswith(f"/api/v1/matches/{body['id']}")
    assert OUTPUT_DATE.match(body["played_at"])
    assert (body["home"]["goals"], body["away"]["goals"], body["result"]) == (1, 2, "VISITANTE")
    assert (body["home"]["formation"], body["away"]["formation"]) == ("2-1-1", "2-1-1")
    assert [
        (
            duel["order"],
            duel["attacker"]["player_name"],
            duel["attacker"]["attribute"],
            duel["attacker"]["value"],
            duel["defender"]["player_name"],
            duel["defender"]["value"],
            duel["goal"],
        )
        for duel in body["duels"]
    ] == EXPECTED_DUELS
    assert body["duels"][2]["attacker"]["condition"] == "MAL_CONDICIONADO"
    assert api.get(f"/matches/{body['id']}").json() == body
    assert club(api, aguias["id"])["cash"] == cash_before


def test_b21_match_refusals_record_nothing(api: httpx2.Client, league: dict) -> None:
    aguias, corujas = league["aguias"], league["corujas"]
    before = len(api.get("/matches").json())
    cases = [
        ({"home_club_id": aguias["id"], "away_club_id": aguias["id"]}, 400),
        ({"home_club_id": aguias["id"]}, 400),
        ({"home_club_id": "1", "away_club_id": 2}, 400),
        ({"home_club_id": aguias["id"], "away_club_id": 99999}, 404),
        ({"home_club_id": corujas["id"], "away_club_id": aguias["id"]}, 409),
        ({"home_club_id": aguias["id"], "away_club_id": corujas["id"]}, 409),
    ]

    for body, status in cases:
        response = api.post("/matches", json=body)
        assert response.status_code == status, body
        assert response.json()["message"]
    assert len(api.get("/matches").json()) == before


def alphabetical(name: str) -> str:
    decomposed = unicodedata.normalize("NFD", name.lower())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def test_b22_match_history_and_standings(api: httpx2.Client, league: dict) -> None:
    aguias, delta, corujas = league["aguias"], league["delta"], league["corujas"]
    api.post("/matches", json={"home_club_id": delta["id"], "away_club_id": aguias["id"]})

    matches = api.get("/matches").json()
    with_corujas = api.get(f"/matches?club_id={corujas['id']}").json()
    standings = api.get("/standings").json()

    assert [match["id"] for match in matches] == sorted((m["id"] for m in matches), reverse=True)
    assert "duels" not in matches[0]
    assert with_corujas == []
    for query, status in (
        ("club_id=abc", 400),
        ("club_id=0", 400),
        ("club_id=", 400),
        ("club_id=99999", 404),
    ):
        assert api.get(f"/matches?{query}").status_code == status, query
    assert api.get("/matches/99999").status_code == 404
    assert len(standings) == len(api.get("/clubs").json())
    assert [row["position"] for row in standings] == list(range(1, len(standings) + 1))
    expected = sorted(
        standings,
        key=lambda row: (
            -row["points"],
            -row["goal_difference"],
            -row["goals_for"],
            alphabetical(row["club_name"]),
            row["club_id"],
        ),
    )
    assert standings == expected


def test_b20_sold_starter_leaves_the_lineup_and_the_club_cannot_play(
    api: httpx2.Client, league: dict
) -> None:
    aguias, delta = league["aguias"], league["delta"]

    api.post(f"/players/{aguias['players']['Otto Rangel']}/sell")

    lineup = api.get(lineup_url(aguias["id"])).json()
    assert (lineup["formation"], lineup["complete"]) == ("2-1-1", False)
    assert len(lineup["players"]) == 4
    match = api.post("/matches", json={"home_club_id": aguias["id"], "away_club_id": delta["id"]})
    assert match.status_code == 409
