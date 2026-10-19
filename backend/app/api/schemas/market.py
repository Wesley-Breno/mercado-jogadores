from typing import Self

from pydantic import BaseModel

from app.api.schemas.common import BrasiliaDateTime, Money
from app.api.validators import BrasiliaInputDateTime, PositiveId
from app.domain.enums import ContractStatus, TransactionType
from app.models import Transaction
from app.services.market_views import PurchaseResult, SaleResult


class PurchaseRequest(BaseModel):
    club_id: PositiveId
    loyalty_until: BrasiliaInputDateTime


class TransactionResponse(BaseModel):
    id: int
    club_id: int
    player_id: int
    player_name: str
    type: TransactionType
    value: Money
    fee: Money
    penalty: Money
    profit: Money | None
    cash_change: Money
    created_at: BrasiliaDateTime

    @classmethod
    def from_transaction(cls, transaction: Transaction) -> Self:
        return cls(
            id=transaction.id,
            club_id=transaction.club_id,
            player_id=transaction.player_id,
            player_name=transaction.player_name,
            type=transaction.type,
            value=transaction.value,
            fee=transaction.fee,
            penalty=transaction.penalty,
            profit=transaction.profit,
            cash_change=transaction.cash_change,
            created_at=transaction.created_at,
        )


class PurchaseContractResponse(BaseModel):
    purchase_value: Money
    loyalty_until: BrasiliaDateTime
    status: ContractStatus


class PurchaseResponse(TransactionResponse):
    contract: PurchaseContractResponse
    club_cash: Money

    @classmethod
    def from_result(cls, result: PurchaseResult) -> Self:
        return cls(
            **TransactionResponse.from_transaction(result.transaction).model_dump(),
            contract=PurchaseContractResponse(
                purchase_value=result.contract.purchase_value,
                loyalty_until=result.contract.loyalty_until,
                status=result.contract.status,
            ),
            club_cash=result.club_cash,
        )


class SaleResponse(TransactionResponse):
    purchase_value: Money
    remaining_days: int
    penalty_rate: int
    contract_status: ContractStatus
    club_cash: Money

    @classmethod
    def from_result(cls, result: SaleResult) -> Self:
        return cls(
            **TransactionResponse.from_transaction(result.transaction).model_dump(),
            purchase_value=result.purchase_value,
            remaining_days=result.remaining_days,
            penalty_rate=result.penalty_rate,
            contract_status=result.contract_status,
            club_cash=result.club_cash,
        )
