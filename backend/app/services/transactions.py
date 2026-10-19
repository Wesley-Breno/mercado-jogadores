from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.domain.transaction_filters import TransactionFilters
from app.domain.transaction_summary import TransactionSummary, summarize_transactions
from app.models import Transaction
from app.repositories.clubs import ClubRepository
from app.repositories.players import PlayerRepository
from app.repositories.transactions import TransactionRepository
from app.services.messages import CLUB_NOT_FOUND, PLAYER_NOT_FOUND


@dataclass(frozen=True)
class TransactionHistory:
    transactions: list[Transaction]
    summary: TransactionSummary


class TransactionService:
    def __init__(self, session: Session) -> None:
        self.clubs = ClubRepository(session)
        self.players = PlayerRepository(session)
        self.transactions = TransactionRepository(session)

    def history(self, club_id: int, filters: TransactionFilters) -> TransactionHistory:
        """RN17: stored values of each moment, never recalculated; a deleted player is 404."""
        if self.clubs.find(club_id) is None:
            raise NotFoundError(CLUB_NOT_FOUND)
        if filters.player_id is not None and self.players.find_active(filters.player_id) is None:
            raise NotFoundError(PLAYER_NOT_FOUND)
        transactions = list(self.transactions.list_for_club(club_id, filters))
        return TransactionHistory(transactions, summarize_transactions(transactions))
