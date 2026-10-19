from dataclasses import dataclass
from enum import StrEnum

from app.domain.attributes import Attribute, AttributeSet
from app.domain.enums import Condition, Position

UNFIT_PERCENT = 85

# RN20: the attacker uses the attribute of the position; the defender always uses defending.
ATTACK_ATTRIBUTE = {
    Position.FORWARD: Attribute.SHOOTING,
    Position.MIDFIELDER: Attribute.PASSING,
    Position.CENTER_BACK: Attribute.DRIBBLING,
    Position.FULL_BACK: Attribute.DRIBBLING,
}
GOALKEEPER_NUMBER = 0
# RN20 ("Quem ataca e quem defende"): 4th vs goalkeeper, 3rd vs 1st, 2nd vs 2nd.
MATCHUPS = ((4, GOALKEEPER_NUMBER), (3, 1), (2, 2))


class MatchResult(StrEnum):
    HOME = "MANDANTE"
    AWAY = "VISITANTE"
    DRAW = "EMPATE"


@dataclass(frozen=True)
class Starter:
    player_id: int
    name: str
    position: Position
    condition: Condition
    attributes: AttributeSet


@dataclass(frozen=True)
class TeamSheet:
    """The five starters of a club in squad order: the goalkeeper and the outfield 1st to 4th."""

    club_id: int
    starters: tuple[Starter, ...]

    def player(self, number: int) -> Starter:
        """Number 0 is the goalkeeper; 1 (deepest) to 4 (most advanced) are the outfield players."""
        return self.starters[number]


@dataclass(frozen=True)
class DuelSide:
    starter: Starter
    attribute: Attribute
    value: int


@dataclass(frozen=True)
class Duel:
    order: int
    attacking_club_id: int
    attacker: DuelSide
    defender: DuelSide

    @property
    def goal(self) -> bool:
        """RN20: a goal only when the attack is greater than the defense; a tie is not a goal."""
        return self.attacker.value > self.defender.value


@dataclass(frozen=True)
class MatchOutcome:
    duels: tuple[Duel, ...]
    home_goals: int
    away_goals: int

    @property
    def result(self) -> MatchResult:
        return match_result(self.home_goals, self.away_goals)


def match_result(home_goals: int, away_goals: int) -> MatchResult:
    if home_goals > away_goals:
        return MatchResult.HOME
    if away_goals > home_goals:
        return MatchResult.AWAY
    return MatchResult.DRAW


def value_in_match(starter: Starter, attribute: Attribute) -> int:
    """RN20: an unfit starter plays with 15% less, rounded to the nearest integer, half up."""
    value = starter.attributes.value_of(attribute)
    if starter.condition is Condition.UNFIT:
        return (value * UNFIT_PERCENT + 50) // 100
    return value


def play_duel(
    order: int, attacking: TeamSheet, defending: TeamSheet, matchup: tuple[int, int]
) -> Duel:
    attacker = attacking.player(matchup[0])
    defender = defending.player(matchup[1])
    attack_attribute = ATTACK_ATTRIBUTE[attacker.position]
    return Duel(
        order=order,
        attacking_club_id=attacking.club_id,
        attacker=DuelSide(attacker, attack_attribute, value_in_match(attacker, attack_attribute)),
        defender=DuelSide(
            defender, Attribute.DEFENDING, value_in_match(defender, Attribute.DEFENDING)
        ),
    )


def play_match(home: TeamSheet, away: TeamSheet) -> MatchOutcome:
    """RN20: no randomness; duels 1 to 3 are the home attacks and 4 to 6 the away attacks."""
    attacks = [(home, away)] * len(MATCHUPS) + [(away, home)] * len(MATCHUPS)
    duels = tuple(
        play_duel(order, attacking, defending, MATCHUPS[(order - 1) % len(MATCHUPS)])
        for order, (attacking, defending) in enumerate(attacks, start=1)
    )
    home_goals = sum(duel.goal for duel in duels if duel.attacking_club_id == home.club_id)
    away_goals = sum(duel.goal for duel in duels if duel.attacking_club_id == away.club_id)
    return MatchOutcome(duels, home_goals, away_goals)
