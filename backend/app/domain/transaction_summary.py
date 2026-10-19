from collections.abc import Iterable
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from app.domain.enums import TransactionType
from app.domain.money import round_money

ZERO = Decimal("0.00")


class TransactionRecord(Protocol):
    type: TransactionType
    value: Decimal
    fee: Decimal
    penalty: Decimal
    profit: Decimal | None
    cash_change: Decimal


@dataclass(frozen=True)
class TransactionSummary:
    total_spent: Decimal = ZERO
    total_received: Decimal = ZERO
    total_fees: Decimal = ZERO
    total_penalties: Decimal = ZERO
    total_profit: Decimal = ZERO


def summarize_transactions(transactions: Iterable[TransactionRecord]) -> TransactionSummary:
    """RN17: totals of the filtered transactions; without transactions every total is 0.00."""
    records = list(transactions)
    purchases = [t for t in records if t.type is TransactionType.PURCHASE]
    sales = [t for t in records if t.type is TransactionType.SALE]
    return TransactionSummary(
        total_spent=round_money(sum((t.value + t.fee for t in purchases), ZERO)),
        total_received=round_money(sum((t.cash_change for t in sales), ZERO)),
        total_fees=round_money(sum((t.fee for t in records), ZERO)),
        total_penalties=round_money(sum((t.penalty for t in sales), ZERO)),
        total_profit=round_money(sum((t.profit or ZERO for t in sales), ZERO)),
    )
