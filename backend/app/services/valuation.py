from dataclasses import dataclass
from decimal import Decimal

from app.domain.pricing import calculate_market_value, calculate_overall
from app.models import Player


@dataclass(frozen=True)
class ValuedPlayer:
    """A player with the indicators calculated at query time (RN05 and RN06), never stored."""

    player: Player
    overall: int
    market_value: Decimal


def value_player(player: Player) -> ValuedPlayer:
    return ValuedPlayer(
        player=player,
        overall=calculate_overall(player.position, player.attribute_set),
        market_value=calculate_market_value(
            player.base_value, player.condition, player.agility, player.age
        ),
    )
