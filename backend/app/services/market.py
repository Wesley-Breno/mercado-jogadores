from decimal import Decimal

from sqlalchemy.orm import Session

from app.api.schemas.market import PurchaseRequest
from app.core.clock import Clock
from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.domain.enums import ContractStatus, TransactionType
from app.domain.market import (
    MAX_SQUAD_SIZE,
    exceeds_cash_limit,
    is_valid_loyalty_end,
    purchase_fee,
    settle_sale,
)
from app.domain.money import format_brl
from app.models import Contract, Transaction
from app.repositories.clubs import ClubRepository
from app.repositories.contracts import ContractRepository
from app.repositories.lineups import LineupRepository
from app.repositories.players import PlayerRepository
from app.repositories.transactions import TransactionRepository
from app.services.market_views import PurchaseResult, SaleResult
from app.services.messages import CLUB_NOT_FOUND, PLAYER_NOT_FOUND
from app.services.valuation import value_player


class MarketService:
    def __init__(self, session: Session, clock: Clock) -> None:
        self.session = session
        self.clock = clock
        self.players = PlayerRepository(session)
        self.clubs = ClubRepository(session)
        self.contracts = ContractRepository(session)
        self.transactions = TransactionRepository(session)
        self.lineups = LineupRepository(session)

    def buy(self, player_id: int, data: PurchaseRequest) -> PurchaseResult:
        """RN12 to RN14: one atomic operation; player and club rows stay locked until commit."""
        now = self.clock.now()
        if not is_valid_loyalty_end(data.loyalty_until, now):
            raise BadRequestError(
                "Campo 'loyalty_until': o fim da fidelidade deve ser depois do momento da compra "
                "e até 1.095 dias depois dele."
            )
        player = self.players.find_active(player_id, for_update=True)
        if player is None:
            raise NotFoundError(PLAYER_NOT_FOUND)
        club = self.clubs.find(data.club_id, for_update=True)
        if club is None:
            raise NotFoundError(CLUB_NOT_FOUND)
        if player.club_id is not None:
            raise ConflictError("O jogador não está livre: ele já pertence a um clube.")
        if self.transactions.club_sold_player(club.id, player.id):
            raise ConflictError(
                "O clube não pode comprar de volta um jogador que ele mesmo vendeu."
            )
        if self.players.count_in_club(club.id) >= MAX_SQUAD_SIZE:
            raise ConflictError(f"O elenco do clube já tem {MAX_SQUAD_SIZE} jogadores.")

        price = value_player(player).market_value
        fee = purchase_fee(price)
        total_cost = price + fee
        if exceeds_cash_limit(total_cost, club.cash):
            raise ConflictError(
                f"O custo da compra ({format_brl(total_cost)}) passa do limite de 50% do caixa "
                f"({format_brl(club.cash / 2)})."
            )

        club.cash -= total_cost
        player.club_id = club.id
        contract = self.contracts.add(
            Contract(
                player_id=player.id,
                club_id=club.id,
                purchase_value=price,
                loyalty_until=data.loyalty_until,
                status=ContractStatus.ACTIVE,
                started_at=now,
            )
        )
        transaction = self.transactions.add(
            Transaction(
                club_id=club.id,
                player_id=player.id,
                player_name=player.name,
                type=TransactionType.PURCHASE,
                value=price,
                fee=fee,
                penalty=Decimal("0.00"),
                profit=None,
                cash_change=-total_cost,
                created_at=now,
            )
        )
        self.session.commit()
        return PurchaseResult(transaction, contract, club.cash)

    def sell(self, player_id: int) -> SaleResult:
        """RN15 and RN16: sold by the current club, at the market value of this moment."""
        now = self.clock.now()
        player = self.players.find_active(player_id, for_update=True)
        if player is None:
            raise NotFoundError(PLAYER_NOT_FOUND)
        if player.club_id is None:
            raise ConflictError(
                "Jogador livre não pode ser vendido: ele não pertence a nenhum clube."
            )
        club = self.clubs.find(player.club_id, for_update=True)
        contract = self.contracts.find_active_for_player(player.id)
        price = value_player(player).market_value
        settlement = settle_sale(price, contract.purchase_value, contract.loyalty_until, now)

        contract.status = settlement.contract_status
        contract.ended_at = now
        club.cash += settlement.credit
        player.club_id = None
        self.lineups.remove_player(player.id)
        transaction = self.transactions.add(
            Transaction(
                club_id=club.id,
                player_id=player.id,
                player_name=player.name,
                type=TransactionType.SALE,
                value=price,
                fee=settlement.commission,
                penalty=settlement.penalty,
                profit=settlement.profit,
                cash_change=settlement.credit,
                created_at=now,
            )
        )
        self.session.commit()
        return SaleResult(
            transaction=transaction,
            purchase_value=contract.purchase_value,
            remaining_days=settlement.remaining_days,
            penalty_rate=settlement.penalty_rate,
            contract_status=contract.status,
            club_cash=club.cash,
        )
