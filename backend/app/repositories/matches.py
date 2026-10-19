from collections.abc import Sequence

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.domain.standings import MatchScore
from app.models import Duel, Match


class MatchRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, match: Match, duels: Sequence[Duel]) -> Match:
        self.session.add(match)
        self.session.flush()
        for duel in duels:
            duel.match_id = match.id
        self.session.add_all(duels)
        self.session.flush()
        return match

    def find(self, match_id: int) -> Match | None:
        return self.session.get(Match, match_id)

    def duels_of(self, match_id: int) -> Sequence[Duel]:
        statement = select(Duel).where(Duel.match_id == match_id).order_by(Duel.order)
        return self.session.scalars(statement).all()

    def list_recent_first(self, club_id: int | None) -> Sequence[Match]:
        """RN21: most recent first; same instant, higher id first."""
        statement = select(Match).order_by(Match.played_at.desc(), Match.id.desc())
        if club_id is not None:
            statement = statement.where(
                or_(Match.home_club_id == club_id, Match.away_club_id == club_id)
            )
        return self.session.scalars(statement).all()

    def scores(self) -> list[MatchScore]:
        statement = select(
            Match.home_club_id, Match.away_club_id, Match.home_goals, Match.away_goals
        )
        return [MatchScore(*row) for row in self.session.execute(statement)]
