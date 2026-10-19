from dataclasses import dataclass

from app.domain.enums import Formation
from app.domain.lineup import LINEUP_SIZE
from app.services.valuation import ValuedPlayer


@dataclass(frozen=True)
class LineupView:
    club_id: int
    formation: Formation | None
    players: list[ValuedPlayer]

    @property
    def complete(self) -> bool:
        return self.formation is not None and len(self.players) == LINEUP_SIZE
