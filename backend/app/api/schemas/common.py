from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

from app.core.clock import BRASILIA_TZ


def format_brasilia(moment: datetime) -> str:
    """RN01: responses use AAAA-MM-DDTHH:MM:SS-03:00 (no microseconds)."""
    return moment.astimezone(BRASILIA_TZ).replace(microsecond=0).isoformat()


# Pydantic writes Decimal as a JSON string by default; the API contract wants JSON numbers.
Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
BrasiliaDateTime = Annotated[
    datetime, PlainSerializer(format_brasilia, return_type=str, when_used="json")
]
