from datetime import datetime, timedelta
from decimal import Decimal

from app.domain.money import percentage_of, round_money

ONE_DAY = timedelta(days=1)
MAX_LOYALTY = timedelta(days=1095)
MAX_SQUAD_SIZE = 12
PURCHASE_FEE_PERCENT = 5
FEE_FREE_MAX_VALUE = Decimal("30.00")
PENALTY_RATE_BANDS = ((0, 0), (30, 5), (180, 10))
LONG_LOYALTY_PENALTY_RATE = 20


def remaining_loyalty_days(loyalty_until: datetime, now: datetime) -> int:
    """RN15: days with fraction, rounded up; 0 when the end of loyalty is now or already passed."""
    remaining = loyalty_until - now
    if remaining <= timedelta(0):
        return 0
    days, fraction = divmod(remaining, ONE_DAY)
    return days + 1 if fraction else days


def penalty_rate(remaining_days: int) -> int:
    """RN15: 0 days → 0%; 1 to 30 → 5%; 31 to 180 → 10%; 181 or more → 20%."""
    for last_day, rate in PENALTY_RATE_BANDS:
        if remaining_days <= last_day:
            return rate
    return LONG_LOYALTY_PENALTY_RATE


def is_valid_loyalty_end(loyalty_until: datetime, now: datetime) -> bool:
    """Limits of loyalty_until: after the purchase moment and at most 1,095 days after it."""
    return now < loyalty_until <= now + MAX_LOYALTY


def purchase_fee(market_value: Decimal) -> Decimal:
    """RN13: 5% of the market value, rounded, only when the value is greater than 30.00."""
    if market_value <= FEE_FREE_MAX_VALUE:
        return Decimal("0.00")
    return round_money(percentage_of(market_value, PURCHASE_FEE_PERCENT))


def exceeds_cash_limit(total_cost: Decimal, cash: Decimal) -> bool:
    """RN13: the total cost may not pass exactly half of the cash, which is never rounded."""
    return total_cost * 2 > cash
