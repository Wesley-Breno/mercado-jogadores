from fastapi import APIRouter

from app.api.deps import MarketServiceDep, PlayerId
from app.api.schemas.market import PurchaseRequest, PurchaseResponse

router = APIRouter(prefix="/players", tags=["Mercado"])


@router.post(
    "/{player_id}/buy",
    summary="Compra um jogador livre pelo valor de mercado, com taxa e contrato (RN12 a RN14)",
)
def buy_player(
    player_id: PlayerId, payload: PurchaseRequest, service: MarketServiceDep
) -> PurchaseResponse:
    return PurchaseResponse.from_result(service.buy(player_id, payload))
