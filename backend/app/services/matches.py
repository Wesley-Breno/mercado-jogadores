from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.api.schemas.matches import MatchRequest
from app.core.clock import Clock
from app.core.errors import ConflictError, NotFoundError
from app.domain.lineup import LINEUP_SIZE
from app.domain.match_engine import MatchOutcome, Starter, TeamSheet, play_match
from app.domain.squad import squad_order_key
from app.models import Club, Duel, Match, Player
from app.repositories.clubs import ClubRepository
from app.repositories.lineups import LineupRepository
from app.repositories.matches import MatchRepository
from app.services.match_views import MatchView
from app.services.messages import CLUB_NOT_FOUND, MATCH_NOT_FOUND


def to_starter(player: Player) -> Starter:
    return Starter(player.id, player.name, player.position, player.condition, player.attribute_set)


def to_duel_records(outcome: MatchOutcome) -> list[Duel]:
    """RN20: each duel keeps names, positions, conditions, attributes and values of the moment."""
    return [
        Duel(
            order=duel.order,
            attacking_club_id=duel.attacking_club_id,
            attacker_id=duel.attacker.starter.player_id,
            defender_id=duel.defender.starter.player_id,
            attacker_name=duel.attacker.starter.name,
            defender_name=duel.defender.starter.name,
            attacker_position=duel.attacker.starter.position,
            defender_position=duel.defender.starter.position,
            attacker_condition=duel.attacker.starter.condition,
            defender_condition=duel.defender.starter.condition,
            attack_attribute=duel.attacker.attribute,
            defense_attribute=duel.defender.attribute,
            attack_value=duel.attacker.value,
            defense_value=duel.defender.value,
            goal=duel.goal,
        )
        for duel in outcome.duels
    ]


class MatchService:
    def __init__(self, session: Session, clock: Clock) -> None:
        self.session = session
        self.clock = clock
        self.clubs = ClubRepository(session)
        self.lineups = LineupRepository(session)
        self.matches = MatchRepository(session)

    def play(self, data: MatchRequest) -> MatchView:
        """RN20: 404 for a missing club, then 409 for an incomplete lineup; one atomic save."""
        home = self.clubs.find(data.home_club_id)
        away = self.clubs.find(data.away_club_id)
        if home is None or away is None:
            raise NotFoundError(CLUB_NOT_FOUND)
        home_sheet, away_sheet = self.team_sheet(home), self.team_sheet(away)
        outcome = play_match(home_sheet, away_sheet)
        duels = to_duel_records(outcome)
        match = self.matches.add(
            Match(
                home_club_id=home.id,
                away_club_id=away.id,
                home_goals=outcome.home_goals,
                away_goals=outcome.away_goals,
                home_formation=home.formation,
                away_formation=away.formation,
                played_at=self.clock.now(),
            ),
            duels,
        )
        self.session.commit()
        return MatchView(match, home.name, away.name, duels)

    def get(self, match_id: int) -> MatchView:
        match = self.matches.find(match_id)
        if match is None:
            raise NotFoundError(MATCH_NOT_FOUND)
        names = self.clubs.names_by_id()
        return MatchView(
            match,
            names[match.home_club_id],
            names[match.away_club_id],
            self.matches.duels_of(match.id),
        )

    def list_matches(self, club_id: int | None) -> list[MatchView]:
        if club_id is not None and not self.clubs.exists(club_id):
            raise NotFoundError(CLUB_NOT_FOUND)
        names = self.clubs.names_by_id()
        return [
            MatchView(match, names[match.home_club_id], names[match.away_club_id])
            for match in self.matches.list_recent_first(club_id)
        ]

    def team_sheet(self, club: Club) -> TeamSheet:
        """RN19 and RN20: a club plays only with the formation saved and the 5 starters."""
        starters: Sequence[Player] = self.lineups.starters(club.id)
        if club.formation is None or len(starters) < LINEUP_SIZE:
            raise ConflictError(
                f"O clube {club.name} não tem a escalação completa, com os 5 titulares."
            )
        ordered = sorted(
            starters, key=lambda player: squad_order_key(player.position, player.name, player.id)
        )
        return TeamSheet(club.id, tuple(to_starter(player) for player in ordered))
