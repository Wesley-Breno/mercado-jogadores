from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
HUNDRED = Decimal(100)


def round_money(value: Decimal) -> Decimal:
    """Rounds once, at the end of a calculation, to 2 places; a 5 goes away from zero."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def percentage_of(value: Decimal, percent: Decimal | int) -> Decimal:
    """Exact percentage, without rounding, so the caller rounds only the final result."""
    return value * Decimal(percent) / HUNDRED
