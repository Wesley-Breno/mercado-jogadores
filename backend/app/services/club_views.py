from dataclasses import dataclass
from decimal import Decimal

from app.models import Club, Contract
from app.services.valuation import ValuedPlayer


@dataclass(frozen=True)
class ClubSummary:
    club: Club
    squad_value: Decimal
    net_worth: Decimal


@dataclass(frozen=True)
class SquadMember:
    valued: ValuedPlayer
    contract: Contract
    remaining_days: int
    penalty_rate: int


@dataclass(frozen=True)
class ClubDetails:
    summary: ClubSummary
    squad: list[SquadMember]
