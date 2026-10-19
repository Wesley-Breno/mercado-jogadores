from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import LineupSlot


class LineupRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def remove_player(self, player_id: int) -> None:
        """RN19: a starter who is sold or becomes sick leaves the lineup; the formation stays."""
        self.session.execute(delete(LineupSlot).where(LineupSlot.player_id == player_id))
