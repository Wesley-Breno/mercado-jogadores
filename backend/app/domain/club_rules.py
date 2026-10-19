from collections.abc import Iterable
from decimal import Decimal
from enum import StrEnum

from app.domain.text import is_letter, strip_accents

INITIAL_CASH = Decimal("300.00")
MAX_CLUBS = 20


class ClubSort(StrEnum):
    NAME = "name"
    NET_WORTH_ASC = "net_worth_asc"
    NET_WORTH_DESC = "net_worth_desc"


def acronym_matches_name(acronym: str, name: str) -> bool:
    """Acronym letters appear in the name in this order, the first one being the first letter of the
    name, comparing without accents and letter case."""
    letters = [char for char in strip_accents(name).upper() if is_letter(char)]
    if not letters or letters[0] != acronym[0]:
        return False
    remaining = iter(letters)
    return all(letter in remaining for letter in acronym)


def calculate_squad_value(market_values: Iterable[Decimal]) -> Decimal:
    """RN11: sum of the current market values of the squad."""
    return sum(market_values, Decimal("0.00"))


def calculate_net_worth(cash: Decimal, squad_value: Decimal) -> Decimal:
    """RN11: cash plus squad value."""
    return cash + squad_value
