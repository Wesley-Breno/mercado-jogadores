from datetime import datetime, timedelta, timezone

# RN01: Brasília is always -03:00 (no daylight saving time).
BRASILIA_TZ = timezone(timedelta(hours=-3))


class Clock:
    """The server instant used by every date rule; tests replace it with a fixed clock."""

    def now(self) -> datetime:
        return datetime.now(BRASILIA_TZ)
