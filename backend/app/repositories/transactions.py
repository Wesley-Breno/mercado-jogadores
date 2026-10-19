from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import TransactionType
from app.domain.transaction_filters import TransactionFilters
from app.models import Transaction


class TransactionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, transaction: Transaction) -> Transaction:
        self.session.add(transaction)
        self.session.flush()
        return transaction

    def club_sold_player(self, club_id: int, player_id: int) -> bool:
        """RN12: a club cannot buy back a player it sold (other clubs can)."""
        statement = select(Transaction.id).where(
            Transaction.club_id == club_id,
            Transaction.player_id == player_id,
            Transaction.type == TransactionType.SALE,
        )
        return self.session.scalar(statement.limit(1)) is not None

    def list_for_club(self, club_id: int, filters: TransactionFilters) -> Sequence[Transaction]:
        """RN17: from the most recent to the oldest; same instant, higher id first."""
        statement = select(Transaction).where(Transaction.club_id == club_id)
        if filters.types is not None:
            statement = statement.where(Transaction.type.in_(filters.types))
        if filters.player_id is not None:
            statement = statement.where(Transaction.player_id == filters.player_id)
        statement = statement.order_by(Transaction.created_at.desc(), Transaction.id.desc())
        return self.session.scalars(statement).all()
