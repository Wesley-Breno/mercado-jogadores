from sqlalchemy.orm import Session

from app.api.schemas.lineups import LineupRequest
from app.core.clock import Clock
from app.core.errors import ConflictError, NotFoundError
from app.domain.enums import Condition
from app.domain.lineup import fits_formation
from app.domain.squad import squad_order_key
from app.models import Club
from app.repositories.clubs import ClubRepository
from app.repositories.lineups import LineupRepository
from app.repositories.players import PlayerRepository
from app.services.lineup_views import LineupView
from app.services.messages import CLUB_NOT_FOUND, PLAYER_NOT_FOUND
from app.services.valuation import value_player


class LineupService:
    def __init__(self, session: Session, clock: Clock) -> None:
        self.session = session
        self.clock = clock
        self.clubs = ClubRepository(session)
        self.players = PlayerRepository(session)
        self.lineups = LineupRepository(session)

    def set_lineup(self, club_id: int, data: LineupRequest) -> LineupView:
        """RN19: replaces the whole lineup in one operation; refusals write nothing."""
        players = self.players.find_active_many(data.player_ids)
        club = self.require_club(club_id, for_update=True)
        if len(players) < len(data.player_ids):
            raise NotFoundError(PLAYER_NOT_FOUND)
        outsiders = [player.name for player in players.values() if player.club_id != club.id]
        if outsiders:
            raise ConflictError(f"Fora do elenco do clube: {', '.join(outsiders)}.")
        sick = [player.name for player in players.values() if player.condition is Condition.SICK]
        if sick:
            raise ConflictError(f"Jogador DOENTE não pode ser escalado: {', '.join(sick)}.")
        if not fits_formation(data.formation, (player.position for player in players.values())):
            raise ConflictError(
                f"As posições não fecham a formação {data.formation}: são precisos 1 GOL e os "
                "jogadores de linha de cada setor."
            )
        self.lineups.replace(club.id, data.player_ids, self.clock.now())
        club.formation = data.formation
        self.session.commit()
        return self.view(club)

    def get_lineup(self, club_id: int) -> LineupView:
        return self.view(self.require_club(club_id))

    def view(self, club: Club) -> LineupView:
        """RN19: starters in squad order; an incomplete lineup keeps the saved formation."""
        starters = sorted(
            (value_player(player) for player in self.lineups.starters(club.id)),
            key=lambda valued: squad_order_key(
                valued.player.position, valued.player.name, valued.player.id
            ),
        )
        return LineupView(club.id, club.formation, starters)

    def require_club(self, club_id: int, *, for_update: bool = False) -> Club:
        club = self.clubs.find(club_id, for_update=for_update)
        if club is None:
            raise NotFoundError(CLUB_NOT_FOUND)
        return club
