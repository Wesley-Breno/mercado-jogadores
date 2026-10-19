from dataclasses import dataclass
from decimal import Decimal

from app.domain.attributes import Attribute, AttributeSet
from app.domain.enums import Condition, Position
from app.domain.money import percentage_of, round_money

MINIMUM_VALUE = Decimal("1.00")

POSITION_WEIGHTS: dict[Position, dict[Attribute, int]] = {
    Position.GOALKEEPER: {
        Attribute.PACE: 10, Attribute.SHOOTING: 0, Attribute.PASSING: 20,
        Attribute.DRIBBLING: 0, Attribute.DEFENDING: 40, Attribute.PHYSICAL: 30,
    },
    Position.CENTER_BACK: {
        Attribute.PACE: 10, Attribute.SHOOTING: 0, Attribute.PASSING: 15,
        Attribute.DRIBBLING: 0, Attribute.DEFENDING: 45, Attribute.PHYSICAL: 30,
    },
    Position.FULL_BACK: {
        Attribute.PACE: 25, Attribute.SHOOTING: 0, Attribute.PASSING: 20,
        Attribute.DRIBBLING: 15, Attribute.DEFENDING: 25, Attribute.PHYSICAL: 15,
    },
    Position.MIDFIELDER: {
        Attribute.PACE: 10, Attribute.SHOOTING: 15, Attribute.PASSING: 35,
        Attribute.DRIBBLING: 25, Attribute.DEFENDING: 5, Attribute.PHYSICAL: 10,
    },
    Position.FORWARD: {
        Attribute.PACE: 20, Attribute.SHOOTING: 40, Attribute.PASSING: 10,
        Attribute.DRIBBLING: 20, Attribute.DEFENDING: 0, Attribute.PHYSICAL: 10,
    },
}  # fmt: skip


@dataclass(frozen=True)
class OverallBand:
    first_point: int
    last_point: int
    value_per_point: Decimal

    def points(self, overall: int) -> int:
        return max(0, min(overall, self.last_point) - self.first_point + 1)


OVERALL_BANDS = (
    OverallBand(41, 60, Decimal("0.50")),
    OverallBand(61, 75, Decimal("2.00")),
    OverallBand(76, 99, Decimal("6.00")),
)
YOUNG_PROSPECT_MAX_AGE = 21

CONDITION_DISCOUNT = {
    Condition.FIT: Decimal(0),
    Condition.UNFIT: Decimal(15),
    Condition.SICK: Decimal(30),
}
HIGH_AGILITY_MIN = 80
LOW_AGILITY_MAX = 30
LOW_AGILITY_EXTRA_DISCOUNT = Decimal(10)
YOUNG_AGE_BONUS = Decimal(10)
VETERAN_MIN_AGE = 32
VETERAN_AGE_PENALTY = Decimal(-10)
TOTAL_PERCENTAGE_FLOOR = Decimal(-40)


def calculate_overall(position: Position, attributes: AttributeSet) -> int:
    """RN06: weighted sum ÷ 100, rounded to the nearest integer with the half going up."""
    weighted_sum = sum(
        attributes.value_of(attribute) * weight
        for attribute, weight in POSITION_WEIGHTS[position].items()
    )
    return (weighted_sum + 50) // 100


def calculate_base_value(overall: int, potential: int, age_at_registration: int) -> Decimal:
    """RN06: progressive overall part, young prospect bonus, one rounding and the 1.00 floor."""
    value = sum((band.value_per_point * band.points(overall) for band in OVERALL_BANDS), Decimal(0))
    if age_at_registration <= YOUNG_PROSPECT_MAX_AGE:
        value = percentage_of(value, 100 + potential - overall)
    return max(round_money(value), MINIMUM_VALUE)


def condition_discount(condition: Condition, agility: int) -> Decimal:
    """RN02 and RN03: agility changes only the discount, and only when the player is not APTO."""
    discount = CONDITION_DISCOUNT[condition]
    if condition is Condition.FIT:
        return discount
    if agility >= HIGH_AGILITY_MIN:
        return discount / 2
    if agility <= LOW_AGILITY_MAX:
        return discount + LOW_AGILITY_EXTRA_DISCOUNT
    return discount


def age_adjustment(age: int) -> Decimal:
    """RN04: by the current age, for any condition."""
    if age <= YOUNG_PROSPECT_MAX_AGE:
        return YOUNG_AGE_BONUS
    if age >= VETERAN_MIN_AGE:
        return VETERAN_AGE_PENALTY
    return Decimal(0)


def calculate_market_value(
    base_value: Decimal, condition: Condition, agility: int, age: int
) -> Decimal:
    """RN05: total percentage with the -40% cap, applied to the base value, rounded, 1.00 floor."""
    total_percentage = max(
        age_adjustment(age) - condition_discount(condition, agility), TOTAL_PERCENTAGE_FLOOR
    )
    value = round_money(percentage_of(base_value, 100 + total_percentage))
    return max(value, MINIMUM_VALUE)
