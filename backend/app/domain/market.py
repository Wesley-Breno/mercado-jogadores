from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from app.domain.enums import ContractStatus
from app.domain.money import percentage_of, round_money

ONE_DAY = timedelta(days=1)
MAX_LOYALTY = timedelta(days=1095)
MAX_SQUAD_SIZE = 12
PURCHASE_FEE_PERCENT = 5
FEE_FREE_MAX_VALUE = Decimal("30.00")
MAX_PENALTY = Decimal("10.00")
COMMISSION_FIRST_BAND = Decimal("10.00")
COMMISSION_FIRST_BAND_PERCENT = 10
COMMISSION_ABOVE_BAND_PERCENT = 20
ZERO = Decimal("0.00")
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


def loyalty_penalty(market_value: Decimal, rate: int) -> Decimal:
    """RN15: market value times the rate, rounded and capped at 10.00."""
    return min(round_money(percentage_of(market_value, rate)), MAX_PENALTY)


def sale_commission(profit: Decimal) -> Decimal:
    """RN16: only with profit; 10% of the part up to 10.00 plus 20% of the rest, rounded once."""
    if profit <= 0:
        return ZERO
    first_band = min(profit, COMMISSION_FIRST_BAND)
    above_band = max(profit - COMMISSION_FIRST_BAND, ZERO)
    return round_money(
        percentage_of(first_band, COMMISSION_FIRST_BAND_PERCENT)
        + percentage_of(above_band, COMMISSION_ABOVE_BAND_PERCENT)
    )


@dataclass(frozen=True)
class SaleSettlement:
    remaining_days: int
    penalty_rate: int
    penalty: Decimal
    profit: Decimal
    commission: Decimal
    credit: Decimal

    @property
    def contract_status(self) -> ContractStatus:
        """RN15: with a penalty the contract is terminated; loyalty fulfilled ends it."""
        return ContractStatus.TERMINATED if self.penalty > 0 else ContractStatus.ENDED


def settle_sale(
    market_value: Decimal, purchase_value: Decimal, loyalty_until: datetime, now: datetime
) -> SaleSettlement:
    """RN15 and RN16: everything the sale charges and credits, from the values of this moment."""
    days = remaining_loyalty_days(loyalty_until, now)
    rate = penalty_rate(days)
    penalty = loyalty_penalty(market_value, rate)
    profit = market_value - purchase_value
    commission = sale_commission(profit)
    return SaleSettlement(
        remaining_days=days,
        penalty_rate=rate,
        penalty=penalty,
        profit=profit,
        commission=commission,
        credit=market_value - penalty - commission,
    )
