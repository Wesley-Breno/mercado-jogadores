from dataclasses import dataclass

from app.domain.enums import position_rank
from app.domain.player_listing import PlayerListQuery, SortCriterion, SortField
from app.domain.text import alphabetical_key, matches_search
from app.services.valuation import ValuedPlayer


@dataclass(frozen=True)
class PlayerPage:
    players: list[ValuedPlayer]
    page: int
    limit: int
    total_items: int
    total_pages: int


def matches_value_and_search(valued: ValuedPlayer, query: PlayerListQuery) -> bool:
    """RN07: the value range uses the market value; the search ignores case and accents."""
    if not query.min_value <= valued.market_value <= query.max_value:
        return False
    return query.search is None or matches_search(valued.player.name, query.search)


def sort_value(valued: ValuedPlayer, field: SortField) -> object:
    player = valued.player
    match field:
        case SortField.NAME:
            return alphabetical_key(player.name)
        case SortField.VALUE:
            return valued.market_value
        case SortField.AGE:
            return player.age
        case SortField.POSITION:
            return position_rank(player.position)


def sort_players(
    players: list[ValuedPlayer], criteria: tuple[SortCriterion, ...]
) -> list[ValuedPlayer]:
    """RN07: the criteria in order, then name and id; sorting is stable, so the last pass wins."""
    ordered = sorted(
        players, key=lambda valued: (alphabetical_key(valued.player.name), valued.player.id)
    )
    for criterion in reversed(criteria):
        ordered.sort(
            key=lambda valued, field=criterion.field: sort_value(valued, field),
            reverse=criterion.descending,
        )
    return ordered
