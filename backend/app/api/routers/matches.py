from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.deps import MatchId, MatchServiceDep
from app.api.params import match_club_filter
from app.api.schemas.matches import MatchRequest, MatchResponse, MatchSummaryResponse

router = APIRouter(prefix="/matches", tags=["Liga"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Joga uma partida: 6 duelos pelos atributos dos titulares, sem sorteio (RN20)",
)
def play_match(
    payload: MatchRequest, request: Request, response: Response, service: MatchServiceDep
) -> MatchResponse:
    played = service.play(payload)
    response.headers["Location"] = str(
        request.app.url_path_for("get_match", match_id=str(played.match.id))
    )
    return MatchResponse.from_view(played)


@router.get("", summary="Histórico de partidas, da mais recente para a mais antiga (RN21)")
def list_matches(
    club_id: Annotated[int | None, Depends(match_club_filter)], service: MatchServiceDep
) -> list[MatchSummaryResponse]:
    return [MatchSummaryResponse.from_view(view) for view in service.list_matches(club_id)]


@router.get("/{match_id}", name="get_match", summary="Partida com os 6 duelos (RN21)")
def get_match(match_id: MatchId, service: MatchServiceDep) -> MatchResponse:
    return MatchResponse.from_view(service.get(match_id))
