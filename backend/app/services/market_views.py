from dataclasses import dataclass
from decimal import Decimal

from app.models import Contract, Transaction


@dataclass(frozen=True)
class PurchaseResult:
    transaction: Transaction
    contract: Contract
    club_cash: Decimal
