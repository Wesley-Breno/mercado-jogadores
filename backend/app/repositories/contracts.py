from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import ContractStatus
from app.models import Contract


class ContractRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def active_by_player(self, club_id: int) -> dict[int, Contract]:
        statement = select(Contract).where(
            Contract.club_id == club_id, Contract.status == ContractStatus.ACTIVE
        )
        return {contract.player_id: contract for contract in self.session.scalars(statement)}

    def add(self, contract: Contract) -> Contract:
        self.session.add(contract)
        self.session.flush()
        return contract

    def find_active_for_player(self, player_id: int) -> Contract | None:
        statement = select(Contract).where(
            Contract.player_id == player_id, Contract.status == ContractStatus.ACTIVE
        )
        return self.session.scalar(statement.with_for_update())
