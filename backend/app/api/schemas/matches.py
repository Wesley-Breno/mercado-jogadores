from typing import Self

from pydantic import BaseModel, model_validator

from app.api.schemas.common import BrasiliaDateTime
from app.api.validators import PositiveId
from app.domain.match_engine import MatchResult
from app.models import Duel
from app.services.match_views import MatchView


class MatchRequest(BaseModel):
    home_club_id: PositiveId
    away_club_id: PositiveId

    @model_validator(mode="after")
    def clubs_are_different(self) -> Self:
        if self.home_club_id == self.away_club_id:
            raise ValueError("O mandante e o visitante devem ser clubes diferentes.")
        return self


class MatchTeamResponse(BaseModel):
    club_id: int
    club_name: str
    formation: str
    goals: int


class DuelPlayerResponse(BaseModel):
    player_id: int
    player_name: str
    position: str
    condition: str
    attribute: str
    value: int


class DuelResponse(BaseModel):
    order: int
    attacking_club_id: int
    attacker: DuelPlayerResponse
    defender: DuelPlayerResponse
    goal: bool

    @classmethod
    def from_record(cls, duel: Duel) -> Self:
        return cls(
            order=duel.order,
            attacking_club_id=duel.attacking_club_id,
            attacker=DuelPlayerResponse(
                player_id=duel.attacker_id,
                player_name=duel.attacker_name,
                position=duel.attacker_position,
                condition=duel.attacker_condition,
                attribute=duel.attack_attribute,
                value=duel.attack_value,
            ),
            defender=DuelPlayerResponse(
                player_id=duel.defender_id,
                player_name=duel.defender_name,
                position=duel.defender_position,
                condition=duel.defender_condition,
                attribute=duel.defense_attribute,
                value=duel.defense_value,
            ),
            goal=duel.goal,
        )


class MatchSummaryResponse(BaseModel):
    id: int
    played_at: BrasiliaDateTime
    home: MatchTeamResponse
    away: MatchTeamResponse
    result: MatchResult

    @classmethod
    def from_view(cls, view: MatchView) -> Self:
        match = view.match
        return cls(
            id=match.id,
            played_at=match.played_at,
            home=MatchTeamResponse(
                club_id=match.home_club_id,
                club_name=view.home_club_name,
                formation=match.home_formation,
                goals=match.home_goals,
            ),
            away=MatchTeamResponse(
                club_id=match.away_club_id,
                club_name=view.away_club_name,
                formation=match.away_formation,
                goals=match.away_goals,
            ),
            result=view.result,
        )


class MatchResponse(MatchSummaryResponse):
    duels: list[DuelResponse]

    @classmethod
    def from_view(cls, view: MatchView) -> Self:
        return cls(
            **MatchSummaryResponse.from_view(view).model_dump(),
            duels=[DuelResponse.from_record(duel) for duel in view.duels],
        )
