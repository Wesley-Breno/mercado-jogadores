from sqlalchemy.orm import Session

from app.domain.standings import Standing, build_standings
from app.repositories.clubs import ClubRepository
from app.repositories.matches import MatchRepository


class StandingsService:
    def __init__(self, session: Session) -> None:
        self.clubs = ClubRepository(session)
        self.matches = MatchRepository(session)

    def standings(self) -> list[Standing]:
        """RN21: calculated from the stored scores on every query, never stored."""
        return build_standings(self.clubs.names_by_id().items(), self.matches.scores())
