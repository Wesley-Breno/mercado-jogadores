from decimal import Decimal

import pytest

from app.domain.club_rules import acronym_matches_name, calculate_net_worth, calculate_squad_value


@pytest.mark.parametrize(
    ("acronym", "name", "matches"),
    [
        ("AGU", "Águias FC", True),
        ("AFC", "Águias FC", True),
        ("AUA", "Águias FC", True),
        ("DFC", "Delta FC", True),
        ("CAN", "Çapa Nova", True),
        ("SPL", "São Paulo", True),
        ("GUA", "Águias FC", False),
        ("DCF", "Delta FC", False),
        ("AGX", "Águias FC", False),
        ("AGU", "Gaviões do Litoral", False),
    ],
)
def test_acronym_letters_follow_the_name_in_order(acronym: str, name: str, matches: bool) -> None:
    assert acronym_matches_name(acronym, name) is matches


def test_squad_value_and_net_worth() -> None:
    squad_value = calculate_squad_value([Decimal("37.00"), Decimal("1.00")])

    assert squad_value == Decimal("38.00")
    assert calculate_net_worth(Decimal("261.15"), squad_value) == Decimal("299.15")
    assert calculate_squad_value([]) == Decimal("0.00")
