from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Player


class PlayerRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, player: Player) -> Player:
        self.session.add(player)
        self.session.flush()
        return player

    def find_active(self, player_id: int) -> Player | None:
        """RN09: a deleted player counts as nonexistent everywhere."""
        return self.session.scalar(
            select(Player).where(Player.id == player_id, Player.deleted_at.is_(None))
        )
