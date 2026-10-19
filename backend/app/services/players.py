from sqlalchemy.orm import Session

from app.api.schemas.players import PlayerCreate
from app.core.errors import NotFoundError
from app.domain.attributes import AttributeSet
from app.domain.enums import Condition
from app.domain.pagination import page_items, total_pages
from app.domain.player_listing import PlayerListQuery
from app.domain.pricing import calculate_base_value, calculate_overall
from app.models import Player
from app.repositories.clubs import ClubRepository
from app.repositories.players import PlayerRepository
from app.services.messages import CLUB_NOT_FOUND, PLAYER_NOT_FOUND
from app.services.player_listing import PlayerPage, matches_value_and_search, sort_players
from app.services.valuation import ValuedPlayer, value_player


class PlayerService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.players = PlayerRepository(session)
        self.clubs = ClubRepository(session)

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

    def list_players(self, query: PlayerListQuery) -> PlayerPage:
        """RN07: search and filters, then sort, then paginate."""
        if query.club_id is not None and not self.clubs.exists(query.club_id):
            raise NotFoundError(CLUB_NOT_FOUND)
        candidates = (value_player(player) for player in self.players.list_active(query))
        matching = [valued for valued in candidates if matches_value_and_search(valued, query)]
        ordered = sort_players(matching, query.sort)
        return PlayerPage(
            players=page_items(ordered, query.page, query.limit),
            page=query.page,
            limit=query.limit,
            total_items=len(ordered),
            total_pages=total_pages(len(ordered), query.limit),
        )

    def get(self, player_id: int) -> ValuedPlayer:
        return value_player(self.require_active(player_id))

    def require_active(self, player_id: int) -> Player:
        player = self.players.find_active(player_id)
        if player is None:
            raise NotFoundError(PLAYER_NOT_FOUND)
        return player
