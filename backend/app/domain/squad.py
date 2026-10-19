from app.domain.enums import Position, position_rank
from app.domain.text import alphabetical_key


def squad_order_key(position: Position, name: str, player_id: int) -> tuple[int, str, int]:
    """RN11: GOL, ZAG, LAT, MEI, ATA, then name (alphabetical order of the Premissas), then id."""
    return position_rank(position), alphabetical_key(name), player_id
