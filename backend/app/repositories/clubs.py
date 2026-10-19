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

    def find_by_name(self, name: str) -> Club | None:
        """RN10: same expression as the unique index uq_clubes_nome (ignores case, not accents)."""
        return self.session.scalar(select(Club).where(func.lower(Club.name) == func.lower(name)))

    def find_by_acronym(self, acronym: str) -> Club | None:
        return self.session.scalar(select(Club).where(Club.acronym == acronym))

    def find(self, club_id: int, *, for_update: bool = False) -> Club | None:
        if club_id > MAX_INTEGER_ID:
            return None
        return self.session.get(Club, club_id, with_for_update=for_update)

    def exists(self, club_id: int) -> bool:
        if club_id > MAX_INTEGER_ID:
            return False
        return self.session.scalar(select(Club.id).where(Club.id == club_id)) is not None

    def list_all(self) -> Sequence[Club]:
        return self.session.scalars(select(Club)).all()

    def names_by_id(self) -> dict[int, str]:
        return dict(self.session.execute(select(Club.id, Club.name)).all())
