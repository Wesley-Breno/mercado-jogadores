from collections.abc import Sequence
from dataclasses import dataclass

from app.domain.match_engine import MatchResult, match_result
from app.models import Duel, Match


@dataclass(frozen=True)
class MatchView:
    """A stored match: nothing is recalculated after it was played (RN20, item 7)."""

    match: Match
    home_club_name: str
    away_club_name: str
    duels: Sequence[Duel] = ()

    @property
    def result(self) -> MatchResult:
        return match_result(self.match.home_goals, self.match.away_goals)
