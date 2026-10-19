from decimal import Decimal

import pytest

from app.domain.attributes import AttributeSet
from app.domain.enums import Condition, Position
from app.domain.pricing import (
    calculate_base_value,
    calculate_market_value,
    calculate_overall,
    condition_discount,
)

APTO, MAL, DOENTE = Condition.FIT, Condition.UNFIT, Condition.SICK


@pytest.mark.parametrize(
    ("position", "attributes", "overall"),
    [
        # Tabela "Exemplos de cálculo do overall" (RN06)
        ("MEI", (68, 65, 80, 78, 52, 60), 73),
        ("ATA", (78, 75, 73, 82, 48, 68), 76),
        ("LAT", (72, 70, 78, 76, 70, 66), 72),
        ("ZAG", (50, 90, 60, 40, 80, 75), 73),
        ("GOL", (55, 30, 65, 40, 72, 68), 68),
        # Ficha de avaliação de exemplo (B06) e exemplo da API (Meia Lua)
        ("ZAG", (60, 30, 55, 40, 81, 77), 74),
        ("ATA", (80, 77, 60, 74, 30, 70), 75),
        ("LAT", (60, 40, 60, 60, 62, 60), 61),
        ("MEI", (70, 68, 82, 79, 55, 64), 75),
    ],
)
def test_overall_uses_position_weights_and_rounds_half_up(
    position: str, attributes: tuple[int, ...], overall: int
) -> None:
    assert calculate_overall(Position(position), AttributeSet(*attributes)) == overall


@pytest.mark.parametrize(
    ("overall", "potential", "age", "base_value"),
    [
        # Tabela "Exemplos de cálculo do valor base" (RN06)
        (75, 86, 25, "40.00"),
        (60, 70, 30, "10.00"),
        (61, 70, 30, "12.00"),
        (76, 80, 22, "46.00"),
        (85, 92, 27, "100.00"),
        (70, 84, 21, "34.20"),
        (70, 84, 22, "30.00"),
        (45, 90, 18, "3.63"),
        (40, 66, 36, "1.00"),
        # Ficha de avaliação de exemplo (B06)
        (85, 99, 20, "114.00"),
        (83, 88, 27, "88.00"),
        (43, 55, 36, "1.50"),
    ],
)
def test_base_value_is_progressive_with_young_prospect_bonus_and_floor(
    overall: int, potential: int, age: int, base_value: str
) -> None:
    assert calculate_base_value(overall, potential, age) == Decimal(base_value)


@pytest.mark.parametrize(
    ("base_value", "condition", "agility", "age", "market_value"),
    [
        # Tabela da RN05
        ("82.00", APTO, 20, 25, "82.00"),
        ("82.00", APTO, 50, 19, "90.20"),
        ("82.00", MAL, 50, 25, "69.70"),
        ("82.00", MAL, 80, 21, "84.05"),
        ("82.00", MAL, 30, 33, "53.30"),
        ("82.00", DOENTE, 90, 25, "69.70"),
        ("82.00", DOENTE, 30, 25, "49.20"),
        ("82.00", DOENTE, 10, 40, "49.20"),
        ("9.50", MAL, 85, 25, "8.79"),
        ("1.00", MAL, 50, 35, "1.00"),
        # Ficha de avaliação de exemplo (B05) e exemplo da API (Meia Lua)
        ("114.00", APTO, 60, 20, "125.40"),
        ("88.00", MAL, 85, 27, "81.40"),
        ("46.00", DOENTE, 20, 34, "27.60"),
        ("1.50", DOENTE, 50, 36, "1.00"),
        ("9.50", MAL, 25, 22, "7.13"),
        ("40.00", MAL, 85, 25, "37.00"),
        ("40.00", APTO, 85, 25, "40.00"),
    ],
)
def test_market_value_follows_rn02_to_rn05(
    base_value: str, condition: Condition, agility: int, age: int, market_value: str
) -> None:
    assert calculate_market_value(Decimal(base_value), condition, agility, age) == Decimal(
        market_value
    )


@pytest.mark.parametrize(
    ("condition", "agility", "discount"),
    [
        (APTO, 10, "0"),
        (APTO, 90, "0"),
        (MAL, 79, "15"),
        (MAL, 80, "7.5"),
        (MAL, 100, "7.5"),
        (MAL, 31, "15"),
        (MAL, 30, "25"),
        (MAL, 1, "25"),
        (DOENTE, 80, "15"),
        (DOENTE, 30, "40"),
    ],
)
def test_agility_changes_only_the_discount_of_players_not_fit(
    condition: Condition, agility: int, discount: str
) -> None:
    assert condition_discount(condition, agility) == Decimal(discount)


@pytest.mark.parametrize(
    ("age", "market_value"),
    [(21, "44.00"), (22, "40.00"), (31, "40.00"), (32, "36.00")],
)
def test_age_limits_of_rn04(age: int, market_value: str) -> None:
    assert calculate_market_value(Decimal("40.00"), APTO, 50, age) == Decimal(market_value)
