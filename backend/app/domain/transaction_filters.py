from dataclasses import dataclass

from app.domain.enums import TransactionType


@dataclass(frozen=True)
class TransactionFilters:
    """RN17 and RN18: optional filters, combined; the summary respects both."""

    types: frozenset[TransactionType] | None = None
    player_id: int | None = None
