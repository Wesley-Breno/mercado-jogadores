from fastapi import APIRouter

from app.api.deps import StandingsServiceDep
from app.api.schemas.standings import StandingResponse

router = APIRouter(prefix="/standings", tags=["Liga"])


@router.get("", summary="Classificação de todos os clubes, calculada a cada consulta (RN21)")
def get_standings(service: StandingsServiceDep) -> list[StandingResponse]:
    return [StandingResponse.from_standing(standing) for standing in service.standings()]
