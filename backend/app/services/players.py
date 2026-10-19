from sqlalchemy.orm import Session

from app.api.schemas.players import PlayerCreate
from app.core.errors import NotFoundError
from app.domain.attributes import AttributeSet
from app.domain.enums import Condition
from app.domain.pricing import calculate_base_value, calculate_overall
from app.models import Player
from app.repositories.players import PlayerRepository
from app.services.valuation import ValuedPlayer, value_player

PLAYER_NOT_FOUND = "Jogador não encontrado."


class PlayerService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.players = PlayerRepository(session)

    def register(self, data: PlayerCreate) -> ValuedPlayer:
        attributes = AttributeSet(*data.attributes)
        overall_at_registration = calculate_overall(data.position, attributes)
        player = Player(
            name=data.name,
            position=data.position,
            agility=data.agility,
            age=data.age,
            base_value=calculate_base_value(overall_at_registration, data.potential, data.age),
            condition=Condition.FIT,
            club_id=None,
            pace=attributes.pace,
            shooting=attributes.shooting,
            passing=attributes.passing,
            dribbling=attributes.dribbling,
            defending=attributes.defending,
            physical=attributes.physical,
            potential=data.potential,
        )
        self.players.add(player)
        self.session.commit()
        return value_player(player)

    def get(self, player_id: int) -> ValuedPlayer:
        return value_player(self.require_active(player_id))

    def require_active(self, player_id: int) -> Player:
        player = self.players.find_active(player_id)
        if player is None:
            raise NotFoundError(PLAYER_NOT_FOUND)
        return player
