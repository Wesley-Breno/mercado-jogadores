from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Club
from app.models.base import MAX_INTEGER_ID


class ClubRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def exists(self, club_id: int) -> bool:
        if club_id > MAX_INTEGER_ID:
            return False
        return self.session.scalar(select(Club.id).where(Club.id == club_id)) is not None
