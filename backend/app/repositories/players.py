from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.player_listing import PlayerListQuery
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

    def list_active(self, query: PlayerListQuery) -> Sequence[Player]:
        """Filters stored columns in SQL; search, market value and order need Python (RN07)."""
        statement = select(Player).where(
            Player.deleted_at.is_(None), Player.age.between(query.min_age, query.max_age)
        )
        if query.position is not None:
            statement = statement.where(Player.position == query.position)
        if query.condition is not None:
            statement = statement.where(Player.condition == query.condition)
        if query.free is not None:
            statement = statement.where(
                Player.club_id.is_(None) if query.free else Player.club_id.is_not(None)
            )
        if query.club_id is not None:
            statement = statement.where(Player.club_id == query.club_id)
        return self.session.scalars(statement).all()
