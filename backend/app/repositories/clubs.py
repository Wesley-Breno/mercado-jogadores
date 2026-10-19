from collections.abc import Sequence

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models import Club
from app.models.base import MAX_INTEGER_ID


class ClubRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def lock_for_creation(self) -> None:
        """Serializes club creation so concurrent requests cannot pass the 20-club limit (RN10)."""
        self.session.execute(text("LOCK TABLE clubes IN SHARE ROW EXCLUSIVE MODE"))

    def add(self, club: Club) -> Club:
        self.session.add(club)
        self.session.flush()
        return club

    def count(self) -> int:
        return self.session.scalar(select(func.count()).select_from(Club))

    def name_taken(self, name: str) -> bool:
        """RN10: same expression as the unique index uq_clubes_nome (ignores case, not accents)."""
        statement = select(Club.id).where(func.lower(Club.name) == func.lower(name))
        return self.session.scalar(statement) is not None

    def acronym_taken(self, acronym: str) -> bool:
        return self.session.scalar(select(Club.id).where(Club.acronym == acronym)) is not None

    def find(self, club_id: int) -> Club | None:
        return self.session.get(Club, club_id)

    def exists(self, club_id: int) -> bool:
        if club_id > MAX_INTEGER_ID:
            return False
        return self.session.scalar(select(Club.id).where(Club.id == club_id)) is not None

    def list_all(self) -> Sequence[Club]:
        return self.session.scalars(select(Club)).all()
