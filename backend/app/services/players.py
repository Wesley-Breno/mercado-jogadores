from sqlalchemy.orm import Session

from app.core.clock import Clock
from app.core.errors import ConflictError, NotFoundError
from app.domain.enums import Condition
from app.domain.pagination import page_items, total_pages
from app.domain.player_listing import PlayerListQuery
from app.domain.player_rules import is_forbidden_condition_change
from app.domain.pricing import calculate_base_value, calculate_overall
from app.models import Player
from app.repositories.clubs import ClubRepository
from app.repositories.lineups import LineupRepository
from app.repositories.players import PlayerRepository
from app.services.messages import CLUB_NOT_FOUND, PLAYER_NOT_FOUND
from app.services.player_inputs import NewPlayer, PlayerEdit
from app.services.player_listing import PlayerPage, matches_value_and_search, sort_players
from app.services.valuation import ValuedPlayer, value_player


class PlayerService:
    def __init__(self, session: Session, clock: Clock) -> None:
        self.session = session
        self.clock = clock
        self.players = PlayerRepository(session)
        self.clubs = ClubRepository(session)
        self.lineups = LineupRepository(session)

    def register(self, new: NewPlayer) -> ValuedPlayer:
        attributes = new.attributes
        overall_at_registration = calculate_overall(new.position, attributes)
        player = Player(
            name=new.name,
            position=new.position,
            agility=new.agility,
            age=new.age,
            base_value=calculate_base_value(overall_at_registration, new.potential, new.age),
            condition=Condition.FIT,
            club_id=None,
            pace=attributes.pace,
            shooting=attributes.shooting,
            passing=attributes.passing,
            dribbling=attributes.dribbling,
            defending=attributes.defending,
            physical=attributes.physical,
            potential=new.potential,
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

    def update(self, player_id: int, edit: PlayerEdit) -> ValuedPlayer:
        """RN08: base value and indicators stay; a player with a club keeps the position."""
        player = self.require_active(player_id, for_update=True)
        if player.club_id is not None and edit.position != player.position:
            raise ConflictError("Jogador com clube não pode mudar de posição.")
        if edit.age < player.age:
            raise ConflictError(f"A idade não pode diminuir: a idade atual é {player.age}.")
        player.name = edit.name
        player.position = edit.position
        player.agility = edit.agility
        player.age = edit.age
        self.session.commit()
        return value_player(player)

    def change_condition(self, player_id: int, condition: Condition) -> ValuedPlayer:
        player = self.require_active(player_id, for_update=True)
        if is_forbidden_condition_change(player.condition, condition):
            raise ConflictError(
                "Jogador DOENTE não pode passar direto para APTO: passe antes por MAL_CONDICIONADO."
            )
        if condition != player.condition:
            player.condition = condition
            if condition is Condition.SICK:
                self.lineups.remove_player(player.id)
            self.session.commit()
        return value_player(player)

    def delete(self, player_id: int) -> None:
        """RN09: logical deletion of a free player; history keeps the old records."""
        player = self.require_active(player_id, for_update=True)
        if player.club_id is not None:
            raise ConflictError("Só jogador livre pode ser excluído: este jogador está num clube.")
        player.deleted_at = self.clock.now()
        self.session.commit()

    def require_active(self, player_id: int, *, for_update: bool = False) -> Player:
        player = self.players.find_active(player_id, for_update=for_update)
        if player is None:
            raise NotFoundError(PLAYER_NOT_FOUND)
        return player
