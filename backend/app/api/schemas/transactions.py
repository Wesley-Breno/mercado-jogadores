from typing import Self

from pydantic import BaseModel

from app.api.schemas.common import Money
from app.api.schemas.market import TransactionResponse
from app.domain.transaction_summary import TransactionSummary
from app.services.transactions import TransactionHistory


class TransactionSummaryResponse(BaseModel):
    total_spent: Money
    total_received: Money
    total_fees: Money
    total_penalties: Money
    total_profit: Money

    @classmethod
    def from_summary(cls, summary: TransactionSummary) -> Self:
        return cls(
            total_spent=summary.total_spent,
            total_received=summary.total_received,
            total_fees=summary.total_fees,
            total_penalties=summary.total_penalties,
            total_profit=summary.total_profit,
        )


class TransactionHistoryResponse(BaseModel):
    data: list[TransactionResponse]
    summary: TransactionSummaryResponse

    @classmethod
    def from_history(cls, history: TransactionHistory) -> Self:
        return cls(
            data=[TransactionResponse.from_transaction(t) for t in history.transactions],
            summary=TransactionSummaryResponse.from_summary(history.summary),
        )
