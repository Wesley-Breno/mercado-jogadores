from collections.abc import Iterable
from dataclasses import dataclass, replace

from app.domain.text import alphabetical_key

WIN_POINTS = 3
DRAW_POINTS = 1


@dataclass(frozen=True)
class MatchScore:
    home_club_id: int
    away_club_id: int
    home_goals: int
    away_goals: int


@dataclass(frozen=True)
class TeamRecord:
    club_id: int
    club_name: str
    played: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0
    goals_for: int = 0
    goals_against: int = 0

    @property
    def goal_difference(self) -> int:
        return self.goals_for - self.goals_against

    @property
    def points(self) -> int:
        return self.wins * WIN_POINTS + self.draws * DRAW_POINTS

    def add_game(self, scored: int, conceded: int) -> "TeamRecord":
        return replace(
            self,
            played=self.played + 1,
            wins=self.wins + int(scored > conceded),
            draws=self.draws + int(scored == conceded),
            losses=self.losses + int(scored < conceded),
            goals_for=self.goals_for + scored,
            goals_against=self.goals_against + conceded,
        )


@dataclass(frozen=True)
class Standing:
    position: int
    record: TeamRecord


def ranking_key(record: TeamRecord) -> tuple[int, int, int, str, int]:
    """RN21: more points, then goal difference, then goals scored, then the name, then the id."""
    return (
        -record.points,
        -record.goal_difference,
        -record.goals_for,
        alphabetical_key(record.club_name),
        record.club_id,
    )


def build_standings(
    clubs: Iterable[tuple[int, str]], scores: Iterable[MatchScore]
) -> list[Standing]:
    """RN21: every club, including the ones that have not played, calculated on every query."""
    records = {club_id: TeamRecord(club_id, name) for club_id, name in clubs}
    for score in scores:
        home, away = score.home_club_id, score.away_club_id
        records[home] = records[home].add_game(score.home_goals, score.away_goals)
        records[away] = records[away].add_game(score.away_goals, score.home_goals)
    ordered = sorted(records.values(), key=ranking_key)
    return [Standing(position, record) for position, record in enumerate(ordered, start=1)]
