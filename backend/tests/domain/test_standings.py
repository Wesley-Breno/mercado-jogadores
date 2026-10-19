from app.domain.standings import MatchScore, build_standings

CLUBS = [
    (1, "Águias FC"),
    (2, "Delta FC"),
    (3, "Gama SC"),
    (4, "Épsilon EC"),
    (5, "Mangue FC"),
    (6, "Tubarões EC"),
]
# Exemplo de classificação da RN21: 6 clubes e 4 partidas.
SCORES = [
    MatchScore(1, 2, 1, 2),
    MatchScore(3, 4, 2, 1),
    MatchScore(4, 1, 3, 2),
    MatchScore(2, 3, 0, 1),
]


def table(standings: list) -> list[tuple]:
    return [
        (
            standing.position,
            standing.record.club_name,
            standing.record.points,
            standing.record.goal_difference,
            standing.record.goals_for,
        )
        for standing in standings
    ]


def test_example_of_the_statement() -> None:
    assert table(build_standings(CLUBS, SCORES)) == [
        (1, "Gama SC", 6, 2, 3),
        (2, "Épsilon EC", 3, 0, 4),
        (3, "Delta FC", 3, 0, 2),
        (4, "Mangue FC", 0, 0, 0),
        (5, "Tubarões EC", 0, 0, 0),
        (6, "Águias FC", 0, -2, 3),
    ]


def test_counts_games_results_and_goals() -> None:
    gama = build_standings(CLUBS, SCORES)[0].record

    assert (gama.played, gama.wins, gama.draws, gama.losses) == (2, 2, 0, 0)
    assert (gama.goals_for, gama.goals_against) == (3, 1)


def test_draw_gives_one_point_to_each_side() -> None:
    standings = build_standings([(1, "Alfa FC"), (2, "Beta FC")], [MatchScore(1, 2, 1, 1)])

    assert [(s.record.points, s.record.draws) for s in standings] == [(1, 1), (1, 1)]


def test_example_after_the_first_match_with_three_clubs() -> None:
    clubs = [(1, "Águias FC"), (2, "Delta FC"), (3, "Gama SC")]

    assert table(build_standings(clubs, [MatchScore(1, 2, 1, 2)])) == [
        (1, "Delta FC", 3, 1, 2),
        (2, "Gama SC", 0, 0, 0),
        (3, "Águias FC", 0, -1, 1),
    ]


def test_full_tie_goes_to_the_name_and_then_the_id() -> None:
    clubs = [(3, "Aguias FC"), (2, "Águias FC"), (1, "Zebra FC")]

    assert [s.record.club_id for s in build_standings(clubs, [])] == [2, 3, 1]


def test_no_clubs_no_standings() -> None:
    assert build_standings([], []) == []
