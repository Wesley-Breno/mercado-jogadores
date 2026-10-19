from dataclasses import dataclass
from decimal import Decimal

from app.domain.enums import TransactionType
from app.domain.transaction_summary import TransactionSummary, summarize_transactions


@dataclass
class Record:
    type: TransactionType
    value: Decimal
    fee: Decimal
    penalty: Decimal
    profit: Decimal | None
    cash_change: Decimal


PURCHASE = Record(
    TransactionType.PURCHASE,
    Decimal("37.00"),
    Decimal("1.85"),
    Decimal("0"),
    None,
    Decimal("-38.85"),
)
SALE = Record(
    TransactionType.SALE,
    Decimal("40.00"),
    Decimal("0.30"),
    Decimal("4.00"),
    Decimal("3.00"),
    Decimal("35.70"),
)
LOSS = Record(
    TransactionType.SALE,
    Decimal("42.50"),
    Decimal("0"),
    Decimal("8.50"),
    Decimal("-7.50"),
    Decimal("34.00"),
)


def test_summary_of_the_statement_example() -> None:
    assert summarize_transactions([SALE, PURCHASE]) == TransactionSummary(
        total_spent=Decimal("38.85"),
        total_received=Decimal("35.70"),
        total_fees=Decimal("2.15"),
        total_penalties=Decimal("4.00"),
        total_profit=Decimal("3.00"),
    )


def test_summary_of_sales_only_has_no_spending() -> None:
    summary = summarize_transactions([SALE])

    assert summary.total_spent == Decimal("0.00")
    assert summary.total_received == Decimal("35.70")


def test_profit_keeps_the_sign() -> None:
    assert summarize_transactions([SALE, LOSS]).total_profit == Decimal("-4.50")


def test_empty_summary_is_zero() -> None:
    assert summarize_transactions([]) == TransactionSummary()
