from fastapi import APIRouter

from app.api.deps import ClubId, LineupServiceDep
from app.api.schemas.errors import error_responses
from app.api.schemas.lineups import LineupRequest, LineupResponse

router = APIRouter(prefix="/clubs", tags=["Liga"])


@router.put(
    "/{club_id}/lineup",
    summary="Escolhe a formação e escala os 5 titulares, substituindo a escalação (RN19)",
    responses=error_responses(400, 404, 409),
)
def set_lineup(
    club_id: ClubId, payload: LineupRequest, service: LineupServiceDep
) -> LineupResponse:
    return LineupResponse.from_view(
        service.set_lineup(club_id, payload.formation, payload.player_ids)
    )


@router.get(
    "/{club_id}/lineup",
    summary="Escalação atual do clube, com a formação (RN19)",
    responses=error_responses(404),
)
def get_lineup(club_id: ClubId, service: LineupServiceDep) -> LineupResponse:
    return LineupResponse.from_view(service.get_lineup(club_id))
