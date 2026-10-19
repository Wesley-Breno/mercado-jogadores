from collections.abc import Sequence

from sqlalchemy import func, select
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

    def find_active(self, player_id: int, *, for_update: bool = False) -> Player | None:
        """RN09: a deleted player counts as nonexistent everywhere."""
        statement = select(Player).where(Player.id == player_id, Player.deleted_at.is_(None))
        if for_update:
            statement = statement.with_for_update()
        return self.session.scalar(statement)

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

    def list_in_clubs(self, club_ids: Sequence[int]) -> Sequence[Player]:
        """Squads of the given clubs (only active players can belong to a club)."""
        statement = select(Player).where(Player.club_id.in_(club_ids), Player.deleted_at.is_(None))
        return self.session.scalars(statement).all()

    def count_in_club(self, club_id: int) -> int:
        statement = select(func.count()).select_from(Player).where(Player.club_id == club_id)
        return self.session.scalar(statement)
