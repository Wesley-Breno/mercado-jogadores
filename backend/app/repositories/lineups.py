from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import LineupSlot, Player


class LineupRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def remove_player(self, player_id: int) -> None:
        """RN19: a starter who is sold or becomes sick leaves the lineup; the formation stays."""
        self.session.execute(delete(LineupSlot).where(LineupSlot.player_id == player_id))

    def replace(self, club_id: int, player_ids: Sequence[int], created_at: datetime) -> None:
        """RN19: the PUT replaces the whole lineup."""
        self.session.execute(delete(LineupSlot).where(LineupSlot.club_id == club_id))
        self.session.add_all(
            LineupSlot(club_id=club_id, player_id=player_id, created_at=created_at)
            for player_id in player_ids
        )
        self.session.flush()

    def starters(self, club_id: int) -> Sequence[Player]:
        statement = (
            select(Player)
            .join(LineupSlot, LineupSlot.player_id == Player.id)
            .where(LineupSlot.club_id == club_id)
        )
        return self.session.scalars(statement).all()
