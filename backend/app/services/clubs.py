from sqlalchemy.orm import Session

from app.core.clock import Clock
from app.core.errors import ConflictError, NotFoundError
from app.domain.club_rules import (
    INITIAL_CASH,
    MAX_CLUBS,
    ClubSort,
    calculate_net_worth,
    calculate_squad_value,
)
from app.domain.market import penalty_rate, remaining_loyalty_days
from app.domain.squad import squad_order_key
from app.domain.text import alphabetical_key
from app.models import Club
from app.repositories.clubs import ClubRepository
from app.repositories.contracts import ContractRepository
from app.repositories.players import PlayerRepository
from app.services.club_views import ClubDetails, ClubSummary, SquadMember
from app.services.messages import CLUB_NOT_FOUND
from app.services.valuation import ValuedPlayer, value_player


def summarize(club: Club, squad: list[ValuedPlayer]) -> ClubSummary:
    """RN11: squad value and net worth are calculated at query time, never stored."""
    squad_value = calculate_squad_value(valued.market_value for valued in squad)
    return ClubSummary(club, squad_value, calculate_net_worth(club.cash, squad_value))


def sort_clubs(summaries: list[ClubSummary], sort: ClubSort) -> list[ClubSummary]:
    """RN11: by name or by net worth; ties go to the name and then the id."""
    ordered = sorted(summaries, key=lambda item: (alphabetical_key(item.club.name), item.club.id))
    if sort is not ClubSort.NAME:
        ordered.sort(key=lambda item: item.net_worth, reverse=sort is ClubSort.NET_WORTH_DESC)
    return ordered


class ClubService:
    def __init__(self, session: Session, clock: Clock) -> None:
        self.session = session
        self.clock = clock
        self.clubs = ClubRepository(session)
        self.players = PlayerRepository(session)
        self.contracts = ContractRepository(session)

    def create(self, name: str, acronym: str) -> ClubSummary:
        """RN10: starts with 300.00 and no players; unique name and acronym; at most 20 clubs."""
        self.clubs.lock_for_creation()
        if self.clubs.count() >= MAX_CLUBS:
            raise ConflictError(f"A liga já tem o máximo de {MAX_CLUBS} clubes.")
        same_name = self.clubs.find_by_name(name)
        if same_name is not None:
            raise ConflictError(f'Já existe um clube com o nome "{same_name.name}".')
        same_acronym = self.clubs.find_by_acronym(acronym)
        if same_acronym is not None:
            raise ConflictError(f'A sigla {acronym} já é do clube "{same_acronym.name}".')
        club = self.clubs.add(Club(name=name, acronym=acronym, cash=INITIAL_CASH))
        self.session.commit()
        return summarize(club, [])

    def list_clubs(self, sort: ClubSort) -> list[ClubSummary]:
        clubs = self.clubs.list_all()
        squads: dict[int, list[ValuedPlayer]] = {club.id: [] for club in clubs}
        for player in self.players.list_in_clubs(list(squads)):
            squads[player.club_id].append(value_player(player))
        return sort_clubs([summarize(club, squads[club.id]) for club in clubs], sort)

    def get(self, club_id: int) -> ClubDetails:
        club = self.require(club_id)
        squad = sorted(
            (value_player(player) for player in self.players.list_in_clubs([club.id])),
            key=lambda valued: squad_order_key(
                valued.player.position, valued.player.name, valued.player.id
            ),
        )
        contracts = self.contracts.active_by_player(club.id)
        now = self.clock.now()
        members = []
        for valued in squad:
            contract = contracts[valued.player.id]
            days = remaining_loyalty_days(contract.loyalty_until, now)
            members.append(SquadMember(valued, contract, days, penalty_rate(days)))
        return ClubDetails(summarize(club, squad), members)

    def require(self, club_id: int) -> Club:
        club = self.clubs.find(club_id)
        if club is None:
            raise NotFoundError(CLUB_NOT_FOUND)
        return club
