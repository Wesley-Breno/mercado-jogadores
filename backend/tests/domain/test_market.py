from datetime import datetime, timedelta

import pytest

from app.core.clock import BRASILIA_TZ
from app.domain.market import penalty_rate, remaining_loyalty_days

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
