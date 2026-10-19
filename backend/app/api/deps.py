import re
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models.base import MAX_INTEGER_ID
from app.services.messages import PLAYER_NOT_FOUND
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


def get_player_service(session: Annotated[Session, Depends(get_session)]) -> PlayerService:
    return PlayerService(session)


PlayerId = Annotated[int, Depends(player_id_from_path)]
PlayerServiceDep = Annotated[PlayerService, Depends(get_player_service)]
