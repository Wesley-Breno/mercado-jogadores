from collections import Counter
from collections.abc import Iterable

from app.domain.enums import Formation, Position

LINEUP_SIZE = 5
DEFENSE_POSITIONS = frozenset({Position.CENTER_BACK, Position.FULL_BACK})

# RN19: outfield players per sector (defense, midfield, attack); the goalkeeper is not counted.
FORMATION_SECTORS: dict[Formation, tuple[int, int, int]] = {
    Formation.THREE_ONE: (3, 0, 1),
    Formation.TWO_TWO: (2, 0, 2),
    Formation.TWO_ONE_ONE: (2, 1, 1),
    Formation.ONE_TWO_ONE: (1, 2, 1),
}


def fits_formation(formation: Formation, positions: Iterable[Position]) -> bool:
    """RN19: exactly one GOL and, in each sector, the number of players of the formation."""
    counts = Counter(positions)
    sectors = (
        sum(counts[position] for position in DEFENSE_POSITIONS),
        counts[Position.MIDFIELDER],
        counts[Position.FORWARD],
    )
    return counts[Position.GOALKEEPER] == 1 and sectors == FORMATION_SECTORS[formation]
