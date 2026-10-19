from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

# Pydantic writes Decimal as a JSON string by default; the API contract wants JSON numbers.
Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
