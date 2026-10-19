from typing import Self

from pydantic import BaseModel, model_validator

from app.api.schemas.common import BrasiliaDateTime, Money
from app.api.schemas.players import PlayerResponse
from app.api.validators import Acronym, ClubName
from app.domain.club_rules import acronym_matches_name
from app.services.club_views import ClubDetails, ClubSummary, SquadMember


class ClubCreate(BaseModel):
    name: ClubName
    acronym: Acronym

    @model_validator(mode="after")
    def check_acronym_matches_name(self) -> Self:
        if not acronym_matches_name(self.acronym, self.name):
            raise ValueError(
                "A sigla deve usar letras do nome, na mesma ordem, começando pela primeira letra "
                "do nome (sem diferenciar maiúsculas e acentos)."
            )
        return self


class ClubResponse(BaseModel):
    id: int
    name: str
    acronym: str
    cash: Money
    squad_value: Money
    net_worth: Money

    @classmethod
    def from_summary(cls, summary: ClubSummary) -> Self:
        club = summary.club
        return cls(
            id=club.id,
            name=club.name,
            acronym=club.acronym,
            cash=club.cash,
            squad_value=summary.squad_value,
            net_worth=summary.net_worth,
        )


class ContractResponse(BaseModel):
    purchase_value: Money
    loyalty_until: BrasiliaDateTime
    remaining_days: int
    penalty_rate: int


class SquadPlayerResponse(PlayerResponse):
    contract: ContractResponse

    @classmethod
    def from_member(cls, member: SquadMember) -> Self:
        return cls(
            **PlayerResponse.from_valued(member.valued).model_dump(),
            contract=ContractResponse(
                purchase_value=member.contract.purchase_value,
                loyalty_until=member.contract.loyalty_until,
                remaining_days=member.remaining_days,
                penalty_rate=member.penalty_rate,
            ),
        )


class ClubDetailResponse(ClubResponse):
    players: list[SquadPlayerResponse]

    @classmethod
    def from_details(cls, details: ClubDetails) -> Self:
        return cls(
            **ClubResponse.from_summary(details.summary).model_dump(),
            players=[SquadPlayerResponse.from_member(member) for member in details.squad],
        )
