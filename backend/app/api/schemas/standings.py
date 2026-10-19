from typing import Self

from pydantic import BaseModel

from app.domain.standings import Standing


class StandingResponse(BaseModel):
    position: int
    club_id: int
    club_name: str
    played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int

    @classmethod
    def from_standing(cls, standing: Standing) -> Self:
        record = standing.record
        return cls(
            position=standing.position,
            club_id=record.club_id,
            club_name=record.club_name,
            played=record.played,
            wins=record.wins,
            draws=record.draws,
            losses=record.losses,
            goals_for=record.goals_for,
            goals_against=record.goals_against,
            goal_difference=record.goal_difference,
            points=record.points,
        )
