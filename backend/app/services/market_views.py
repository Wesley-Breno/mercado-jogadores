from dataclasses import dataclass
from decimal import Decimal

from app.domain.enums import ContractStatus
from app.models import Contract, Transaction


@dataclass(frozen=True)
class PurchaseResult:
    transaction: Transaction
    contract: Contract
    club_cash: Decimal


@dataclass(frozen=True)
class SaleResult:
    transaction: Transaction
    purchase_value: Decimal
    remaining_days: int
    penalty_rate: int
    contract_status: ContractStatus
    club_cash: Decimal
