from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import TransactionType
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
