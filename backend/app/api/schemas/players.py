from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

from app.api.schemas.common import Money
from app.api.validators import PlayerName, StrictInt
from app.domain.enums import Condition, Position
from app.domain.player_rules import (
    MAX_AGE,
    MAX_AGILITY,
    MAX_ATTRIBUTE_SUM,
    MAX_INDICATOR,
    MIN_AGE,
    MIN_AGILITY,
    MIN_INDICATOR,
    POTENTIAL_EQUALS_MAX_ATTRIBUTE_AGE,
    VETERAN_AGILITY_AGE,
    VETERAN_MAX_AGILITY,
)
from app.services.player_listing import PlayerPage
from app.services.valuation import ValuedPlayer

Agility = Annotated[StrictInt, Field(ge=MIN_AGILITY, le=MAX_AGILITY)]
Age = Annotated[StrictInt, Field(ge=MIN_AGE, le=MAX_AGE)]
Indicator = Annotated[StrictInt, Field(ge=MIN_INDICATOR, le=MAX_INDICATOR)]


def check_veteran_agility(age: int, agility: int) -> None:
    if age >= VETERAN_AGILITY_AGE and agility > VETERAN_MAX_AGILITY:
        raise ValueError(
            f"Com {VETERAN_AGILITY_AGE} anos ou mais, a agilidade deve ser no máximo "
            f"{VETERAN_MAX_AGILITY}."
        )


class PlayerCreate(BaseModel):
    name: PlayerName
    position: Position
    agility: Agility
    age: Age
    pace: Indicator
    shooting: Indicator
    passing: Indicator
    dribbling: Indicator
    defending: Indicator
    physical: Indicator
    potential: Indicator

    @property
    def attributes(self) -> tuple[int, ...]:
        return (
            self.pace,
            self.shooting,
            self.passing,
            self.dribbling,
            self.defending,
            self.physical,
        )

    @model_validator(mode="after")
    def check_rules_between_fields(self) -> Self:
        highest = max(self.attributes)
        if sum(self.attributes) > MAX_ATTRIBUTE_SUM:
            raise ValueError(f"A soma dos seis atributos não pode passar de {MAX_ATTRIBUTE_SUM}.")
        if self.potential < highest:
            raise ValueError("O potencial não pode ser menor que o maior dos seis atributos.")
        if self.age >= POTENTIAL_EQUALS_MAX_ATTRIBUTE_AGE and self.potential != highest:
            raise ValueError(
                f"Com {POTENTIAL_EQUALS_MAX_ATTRIBUTE_AGE} anos ou mais no cadastro, o potencial "
                "deve ser igual ao maior dos seis atributos."
            )
        check_veteran_agility(self.age, self.agility)
        return self


class PlayerUpdate(BaseModel):
    """RN08: only these four fields change; indicators, potential and base value stay (V7)."""

    name: PlayerName
    position: Position
    agility: Agility
    age: Age

    @model_validator(mode="after")
    def check_rules_between_fields(self) -> Self:
        check_veteran_agility(self.age, self.agility)
        return self


class ConditionChange(BaseModel):
    condition: Condition


class PlayerResponse(BaseModel):
    id: int
    name: str
    position: Position
    agility: int
    age: int
    condition: Condition
    base_value: Money
    market_value: Money
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int
    potential: int
    overall: int
    club_id: int | None

    @classmethod
    def from_valued(cls, valued: ValuedPlayer) -> Self:
        player = valued.player
        return cls(
            id=player.id,
            name=player.name,
            position=player.position,
            agility=player.agility,
            age=player.age,
            condition=player.condition,
            base_value=player.base_value,
            market_value=valued.market_value,
            pace=player.pace,
            shooting=player.shooting,
            passing=player.passing,
            dribbling=player.dribbling,
            defending=player.defending,
            physical=player.physical,
            potential=player.potential,
            overall=valued.overall,
            club_id=player.club_id,
        )


class PageMeta(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int


class PlayerPageResponse(BaseModel):
    data: list[PlayerResponse]
    meta: PageMeta

    @classmethod
    def from_page(cls, page: PlayerPage) -> Self:
        return cls(
            data=[PlayerResponse.from_valued(valued) for valued in page.players],
            meta=PageMeta(
                page=page.page,
                limit=page.limit,
                total_items=page.total_items,
                total_pages=page.total_pages,
            ),
        )
