from dataclasses import dataclass
from enum import StrEnum


class Attribute(StrEnum):
    PACE = "pace"
    SHOOTING = "shooting"
    PASSING = "passing"
    DRIBBLING = "dribbling"
    DEFENDING = "defending"
    PHYSICAL = "physical"


@dataclass(frozen=True)
class AttributeSet:
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int

    def value_of(self, attribute: Attribute) -> int:
        return getattr(self, attribute.value)
