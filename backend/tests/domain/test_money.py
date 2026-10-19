from decimal import Decimal

import pytest

from app.domain.money import percentage_of, round_money


@pytest.mark.parametrize(
    ("raw", "rounded"),
    [
        ("14.775", "14.78"),
        ("0.385", "0.39"),
        ("8.7875", "8.79"),
        ("3.625", "3.63"),
        ("1.5005", "1.50"),
        ("1.002", "1.00"),
        ("0.75", "0.75"),
        ("-0.385", "-0.39"),
        ("-7.125", "-7.13"),
        ("40", "40.00"),
    ],
)
def test_rounds_half_away_from_zero_to_two_places(raw: str, rounded: str) -> None:
    assert round_money(Decimal(raw)) == Decimal(rounded)
    assert str(round_money(Decimal(raw))) == rounded


@pytest.mark.parametrize(
    ("value", "percent", "expected"),
    [
        ("30.01", 5, "1.5005"),
        ("82.00", 85, "69.70"),
        ("9.50", Decimal("92.5"), "8.7875"),
        ("64.00", 10, "6.40"),
    ],
)
def test_percentage_is_exact_until_the_caller_rounds(
    value: str, percent: Decimal | int, expected: str
) -> None:
    assert percentage_of(Decimal(value), percent) == Decimal(expected)
