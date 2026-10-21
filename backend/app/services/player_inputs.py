from dataclasses import dataclass

from app.domain.attributes import AttributeSet
from app.domain.enums import Position


@dataclass(frozen=True)
class NewPlayer:
    """A registration that already passed the field rules of the API."""

    name: str
    position: Position
    agility: int
    age: int
    attributes: AttributeSet
    potential: int


@dataclass(frozen=True)
class PlayerEdit:
    """RN08: the only four fields an edition changes."""

    name: str
    position: Position
    agility: int
    age: int
