from typing import Annotated, Self

from pydantic import BaseModel, Field, field_validator

from app.api.schemas.players import PlayerResponse
from app.api.validators import PositiveId
from app.domain.enums import Formation
from app.domain.lineup import LINEUP_SIZE
from app.services.lineup_views import LineupView


class LineupRequest(BaseModel):
    formation: Formation
    player_ids: Annotated[list[PositiveId], Field(min_length=LINEUP_SIZE, max_length=LINEUP_SIZE)]

    @field_validator("player_ids")
    @classmethod
    def ids_are_distinct(cls, player_ids: list[int]) -> list[int]:
        if len(set(player_ids)) < len(player_ids):
            raise ValueError("os 5 ids devem ser diferentes.")
        return player_ids


class LineupResponse(BaseModel):
    club_id: int
    formation: Formation | None
    complete: bool
    players: list[PlayerResponse]

    @classmethod
    def from_view(cls, view: LineupView) -> Self:
        return cls(
            club_id=view.club_id,
            formation=view.formation,
            complete=view.complete,
            players=[PlayerResponse.from_valued(valued) for valued in view.players],
        )
