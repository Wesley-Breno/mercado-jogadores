from fastapi import APIRouter

from app.api.deps import ClubId, LineupServiceDep
from app.api.schemas.lineups import LineupRequest, LineupResponse

router = APIRouter(prefix="/clubs", tags=["Liga"])


@router.put(
    "/{club_id}/lineup",
    summary="Escolhe a formação e escala os 5 titulares, substituindo a escalação (RN19)",
)
def set_lineup(
    club_id: ClubId, payload: LineupRequest, service: LineupServiceDep
) -> LineupResponse:
    return LineupResponse.from_view(service.set_lineup(club_id, payload))


@router.get("/{club_id}/lineup", summary="Escalação atual do clube, com a formação (RN19)")
def get_lineup(club_id: ClubId, service: LineupServiceDep) -> LineupResponse:
    return LineupResponse.from_view(service.get_lineup(club_id))
