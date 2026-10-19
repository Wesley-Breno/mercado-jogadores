import re
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.clock import Clock
from app.core.errors import NotFoundError
from app.models.base import MAX_INTEGER_ID
from app.services.clubs import ClubService
from app.services.messages import CLUB_NOT_FOUND, PLAYER_NOT_FOUND
from app.services.players import PlayerService

RESOURCE_ID_PATTERN = re.compile(r"[1-9][0-9]*")


def get_session(request: Request) -> Iterator[Session]:
    """One session per request; closing it rolls back anything not committed."""
    session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()


def parse_resource_id(raw_id: str, not_found_message: str) -> int:
    """V8: an id that is not a positive integer without leading zeros or is above the limit: 404."""
    if not RESOURCE_ID_PATTERN.fullmatch(raw_id) or int(raw_id) > MAX_INTEGER_ID:
        raise NotFoundError(not_found_message)
    return int(raw_id)


def player_id_from_path(player_id: str) -> int:
    return parse_resource_id(player_id, PLAYER_NOT_FOUND)


def club_id_from_path(club_id: str) -> int:
    return parse_resource_id(club_id, CLUB_NOT_FOUND)


def get_clock() -> Clock:
    return Clock()


SessionDep = Annotated[Session, Depends(get_session)]
ClockDep = Annotated[Clock, Depends(get_clock)]


def get_player_service(session: SessionDep, clock: ClockDep) -> PlayerService:
    return PlayerService(session, clock)


PlayerId = Annotated[int, Depends(player_id_from_path)]
PlayerServiceDep = Annotated[PlayerService, Depends(get_player_service)]


def get_club_service(session: SessionDep, clock: ClockDep) -> ClubService:
    return ClubService(session, clock)


ClubId = Annotated[int, Depends(club_id_from_path)]
ClubServiceDep = Annotated[ClubService, Depends(get_club_service)]
