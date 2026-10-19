from datetime import timedelta, timezone

# RN01: Brasília is always -03:00 (no daylight saving time).
BRASILIA_TZ = timezone(timedelta(hours=-3))
