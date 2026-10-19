from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.deps import ClubId, ClubServiceDep
from app.api.params import club_sort
from app.api.schemas.clubs import ClubCreate, ClubDetailResponse, ClubResponse
from app.domain.club_rules import ClubSort

router = APIRouter(prefix="/clubs", tags=["Clubes"])


@router.get("", summary="Lista os clubes, por nome ou por patrimônio (RN11)")
def list_clubs(
    sort: Annotated[ClubSort, Depends(club_sort)], service: ClubServiceDep
) -> list[ClubResponse]:
    return [ClubResponse.from_summary(summary) for summary in service.list_clubs(sort)]


@router.post("", status_code=status.HTTP_201_CREATED, summary="Cria um clube com 300,00 (RN10)")
def create_club(
    payload: ClubCreate, request: Request, response: Response, service: ClubServiceDep
) -> ClubResponse:
    created = service.create(payload)
    response.headers["Location"] = str(
        request.app.url_path_for("get_club", club_id=str(created.club.id))
    )
    return ClubResponse.from_summary(created)


@router.get(
    "/{club_id}",
    name="get_club",
    summary="Consulta o clube com o elenco, os contratos, o valor do elenco e o patrimônio",
)
def get_club(club_id: ClubId, service: ClubServiceDep) -> ClubDetailResponse:
    return ClubDetailResponse.from_details(service.get(club_id))
