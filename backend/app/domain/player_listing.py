from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum

from app.domain.enums import Condition, Position
from app.domain.player_rules import MAX_AGE, MIN_AGE

MIN_VALUE_FILTER = Decimal(0)
MAX_VALUE_FILTER = Decimal(550)
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 10
MAX_LIMIT = 50
MAX_SORT_CRITERIA = 2


class SortField(StrEnum):
    NAME = "name"
    VALUE = "value"
    AGE = "age"
    POSITION = "position"


@dataclass(frozen=True)
class SortCriterion:
    field: SortField
    descending: bool = False


SORT_OPTIONS = {
    "name": SortCriterion(SortField.NAME),
    "value_asc": SortCriterion(SortField.VALUE),
    "value_desc": SortCriterion(SortField.VALUE, descending=True),
    "age_asc": SortCriterion(SortField.AGE),
    "age_desc": SortCriterion(SortField.AGE, descending=True),
    "position": SortCriterion(SortField.POSITION),
}


@dataclass(frozen=True)
class PlayerListQuery:
    """RN07: search and filters (all combined), sort criteria and the requested page."""

    search: str | None = None
    position: Position | None = None
    condition: Condition | None = None
    free: bool | None = None
    club_id: int | None = None
    min_age: int = MIN_AGE
    max_age: int = MAX_AGE
    min_value: Decimal = MIN_VALUE_FILTER
    max_value: Decimal = MAX_VALUE_FILTER
    sort: tuple[SortCriterion, ...] = field(default=(SORT_OPTIONS["name"],))
    page: int = DEFAULT_PAGE
    limit: int = DEFAULT_LIMIT
