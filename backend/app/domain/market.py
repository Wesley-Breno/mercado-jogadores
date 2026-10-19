from datetime import datetime, timedelta

ONE_DAY = timedelta(days=1)
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
