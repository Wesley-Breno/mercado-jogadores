import pytest

from app.domain.attributes import Attribute, AttributeSet
from app.domain.enums import Condition, Position
from app.domain.match_engine import (
    MatchResult,
    Starter,
    TeamSheet,
    match_result,
    play_match,
    value_in_match,
)

GOL, ZAG, LAT, MEI, ATA = (Position(code) for code in ("GOL", "ZAG", "LAT", "MEI", "ATA"))
APTO, MAL = Condition.FIT, Condition.UNFIT


def starter(
    player_id: int,
    name: str,
    position: Position,
    condition: Condition = APTO,
    **values: int,
) -> Starter:
    attributes = {attribute.value: 50 for attribute in Attribute} | values
    return Starter(player_id, name, position, condition, AttributeSet(**attributes))


# Exemplo completo da RN20: Águias FC (mandante) contra Delta FC (visitante), os dois no 2-1-1.
AGUIAS = TeamSheet(
    1,
    (
        starter(30, "Rui Prado", GOL, defending=77),
        starter(32, "Téo Brandão", ZAG, defending=84),
        starter(31, "Davi Lins", LAT, MAL, dribbling=74, defending=66),
        starter(33, "Lauro Neves", MEI, passing=82),
        starter(34, "Otto Rangel", ATA, shooting=75),
    ),
)
DELTA = TeamSheet(
    2,
    (
        starter(40, "Ivo Teles", GOL, defending=72),
        starter(41, "Hugo Vaz", ZAG, defending=84),
        starter(42, "Lino Matos", LAT, dribbling=79, defending=63),
        starter(43, "Nei Soares", MEI, passing=70),
        starter(44, "Ugo Falcão", ATA, shooting=81),
    ),
)


def test_example_of_the_statement() -> None:
    outcome = play_match(AGUIAS, DELTA)

    assert [
        (
            duel.order,
            duel.attacker.starter.name,
            duel.attacker.attribute.value,
            duel.attacker.value,
            duel.defender.starter.name,
            duel.defender.value,
            duel.goal,
        )
        for duel in outcome.duels
    ] == [
        (1, "Otto Rangel", "shooting", 75, "Ivo Teles", 72, True),
        (2, "Lauro Neves", "passing", 82, "Hugo Vaz", 84, False),
        (3, "Davi Lins", "dribbling", 63, "Lino Matos", 63, False),
        (4, "Ugo Falcão", "shooting", 81, "Rui Prado", 77, True),
        (5, "Nei Soares", "passing", 70, "Téo Brandão", 84, False),
        (6, "Lino Matos", "dribbling", 79, "Davi Lins", 56, True),
    ]
    assert (outcome.home_goals, outcome.away_goals, outcome.result) == (1, 2, MatchResult.AWAY)
    assert [duel.attacking_club_id for duel in outcome.duels] == [1, 1, 1, 2, 2, 2]


@pytest.mark.parametrize(
    ("value", "condition", "in_match"),
    [(74, MAL, 63), (66, MAL, 56), (50, MAL, 43), (1, MAL, 1), (99, MAL, 84), (74, APTO, 74)],
)
def test_unfit_starter_plays_with_15_percent_less_rounded_half_up(
    value: int, condition: Condition, in_match: int
) -> None:
    player = starter(1, "Teste Um", ATA, condition, shooting=value)

    assert value_in_match(player, Attribute.SHOOTING) == in_match


@pytest.mark.parametrize(
    ("positions", "attack_attributes"),
    [
        ((GOL, ZAG, LAT, LAT, ATA), ["shooting", "dribbling", "dribbling"]),
        ((GOL, ZAG, LAT, ATA, ATA), ["shooting", "shooting", "dribbling"]),
        ((GOL, ZAG, LAT, MEI, ATA), ["shooting", "passing", "dribbling"]),
        ((GOL, ZAG, MEI, MEI, ATA), ["shooting", "passing", "passing"]),
    ],
    ids=["3-1", "2-2", "2-1-1", "1-2-1"],
)
def test_attack_attribute_follows_the_attacker_position(
    positions: tuple[Position, ...], attack_attributes: list[str]
) -> None:
    team = TeamSheet(1, tuple(starter(i, f"Jogador {i}", p) for i, p in enumerate(positions, 1)))

    outcome = play_match(team, DELTA)

    assert [duel.attacker.attribute.value for duel in outcome.duels[:3]] == attack_attributes
    assert [duel.defender.starter.position for duel in outcome.duels[3:]] == list(positions[:3])


@pytest.mark.parametrize(
    ("home", "away", "result"),
    [(2, 1, MatchResult.HOME), (0, 3, MatchResult.AWAY), (1, 1, MatchResult.DRAW)],
)
def test_result_by_goals(home: int, away: int, result: MatchResult) -> None:
    assert match_result(home, away) is result


def test_same_starters_give_the_same_result() -> None:
    assert play_match(AGUIAS, DELTA) == play_match(AGUIAS, DELTA)
