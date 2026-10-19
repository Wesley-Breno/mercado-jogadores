from fastapi.testclient import TestClient
from sqlalchemy import Engine, text

from tests.api.test_clubs import create_club
from tests.api.test_matches import play

STANDINGS_URL = "/api/v1/standings"
FIELDS = {
    "position",
    "club_id",
    "club_name",
    "played",
    "wins",
    "draws",
    "losses",
    "goals_for",
    "goals_against",
    "goal_difference",
    "points",
}


def store_score(engine: Engine, home: int, away: int, home_goals: int, away_goals: int) -> None:
    """Stores a played match straight in the database, with the score that the test needs."""
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO partidas (mandante_id, visitante_id, gols_mandante, gols_visitante,"
                " formacao_mandante, formacao_visitante, jogada_em)"
                " VALUES (:home, :away, :home_goals, :away_goals, '2-1-1', '2-1-1', now())"
            ),
            {"home": home, "away": away, "home_goals": home_goals, "away_goals": away_goals},
        )


def test_example_of_the_statement_with_six_clubs(client: TestClient, engine: Engine) -> None:
    aguias = create_club(client, "Águias FC", "AGU")
    delta = create_club(client, "Delta FC", "DFC")
    gama = create_club(client, "Gama SC", "GSC")
    epsilon = create_club(client, "Épsilon EC", "EEC")
    create_club(client, "Tubarões EC", "TEC")
    create_club(client, "Mangue FC", "MFC")
    for score in ((aguias, delta, 1, 2), (gama, epsilon, 2, 1), (epsilon, aguias, 3, 2)):
        store_score(engine, *score)
    store_score(engine, delta, gama, 0, 1)

    body = client.get(STANDINGS_URL).json()

    assert [
        (row["position"], row["club_name"], row["points"], row["goal_difference"]) for row in body
    ] == [
        (1, "Gama SC", 6, 2),
        (2, "Épsilon EC", 3, 0),
        (3, "Delta FC", 3, 0),
        (4, "Mangue FC", 0, 0),
        (5, "Tubarões EC", 0, 0),
        (6, "Águias FC", 0, -2),
    ]
    assert body[0] == {
        "position": 1,
        "club_id": gama,
        "club_name": "Gama SC",
        "played": 2,
        "wins": 2,
        "draws": 0,
        "losses": 0,
        "goals_for": 3,
        "goals_against": 1,
        "goal_difference": 2,
        "points": 6,
    }


def test_clubs_that_have_not_played_appear_with_zeros(client: TestClient) -> None:
    create_club(client, "Gama SC", "GSC")

    body = client.get(STANDINGS_URL).json()

    assert body == [
        {
            "position": 1,
            "club_id": 1,
            "club_name": "Gama SC",
            "played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_for": 0,
            "goals_against": 0,
            "goal_difference": 0,
            "points": 0,
        }
    ]
    assert set(body[0]) == FIELDS


def test_empty_league_is_200(client: TestClient) -> None:
    response = client.get(STANDINGS_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_played_match_updates_the_standings(client: TestClient, league: dict) -> None:
    create_club(client, "Gama SC", "GSC")
    play(client, league["aguias"]["id"], league["delta"]["id"])

    body = client.get(STANDINGS_URL).json()

    assert [(row["club_name"], row["points"], row["played"]) for row in body] == [
        ("Delta FC", 3, 1),
        ("Gama SC", 0, 0),
        ("Águias FC", 0, 1),
    ]
