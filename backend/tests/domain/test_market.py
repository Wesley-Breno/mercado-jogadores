from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from app.core.clock import BRASILIA_TZ
from app.domain.market import (
    exceeds_cash_limit,
    is_valid_loyalty_end,
    penalty_rate,
    purchase_fee,
    remaining_loyalty_days,
)

SALE_MOMENT = datetime(2026, 11, 5, 16, 40, tzinfo=BRASILIA_TZ)


@pytest.mark.parametrize(
    ("loyalty_left", "days", "rate"),
    [
        # Tabela da RN15
        (timedelta(days=-1), 0, 0),
        (timedelta(days=10, hours=2), 11, 5),
        (timedelta(days=30), 30, 5),
        (timedelta(days=30, minutes=1), 31, 10),
        (timedelta(days=180), 180, 10),
        (timedelta(days=180, minutes=1), 181, 20),
        (timedelta(days=200), 200, 20),
        # Limites e exemplos da venda (2.3.2) e da ficha de avaliação (B14)
        (timedelta(0), 0, 0),
        (timedelta(seconds=1), 1, 5),
        (timedelta(days=116, hours=17, minutes=35), 117, 10),
        (timedelta(days=30, hours=6, minutes=1, seconds=29), 31, 10),
        (timedelta(days=199, hours=23, minutes=57, seconds=50), 200, 20),
    ],
)
def test_remaining_days_round_up_and_set_the_penalty_rate(
    loyalty_left: timedelta, days: int, rate: int
) -> None:
    remaining = remaining_loyalty_days(SALE_MOMENT + loyalty_left, SALE_MOMENT)

    assert remaining == days
    assert penalty_rate(remaining) == rate


def test_example_of_the_sale_endpoint() -> None:
    loyalty_until = datetime(2027, 3, 2, 10, 15, tzinfo=BRASILIA_TZ)

    assert remaining_loyalty_days(loyalty_until, SALE_MOMENT) == 117


@pytest.mark.parametrize(
    ("cash", "market_value", "fee", "accepted"),
    [
        # Tabela da RN13
        ("300.00", "28.00", "0.00", True),
        ("300.00", "30.00", "0.00", True),
        ("300.00", "30.01", "1.50", True),
        ("100.00", "47.62", "2.38", True),
        ("100.00", "48.00", "2.40", False),
        # Ficha de avaliação de exemplo (B10): limite de 94,705 sem arredondar
        ("189.41", "90.20", "4.51", False),
        ("189.41", "90.19", "4.51", True),
        ("261.15", "124.36", "6.22", False),
    ],
)
def test_purchase_fee_and_half_cash_limit(
    cash: str, market_value: str, fee: str, accepted: bool
) -> None:
    value = Decimal(market_value)

    assert purchase_fee(value) == Decimal(fee)
    assert exceeds_cash_limit(value + purchase_fee(value), Decimal(cash)) is not accepted


@pytest.mark.parametrize(
    ("loyalty_left", "valid"),
    [
        (timedelta(0), False),
        (timedelta(minutes=-1), False),
        (timedelta(minutes=1), True),
        (timedelta(days=1095), True),
        (timedelta(days=1095, minutes=1), False),
    ],
)
def test_loyalty_end_is_future_and_at_most_1095_days(loyalty_left: timedelta, valid: bool) -> None:
    assert is_valid_loyalty_end(SALE_MOMENT + loyalty_left, SALE_MOMENT) is valid
