from fastapi import APIRouter

from app.api.deps import MarketServiceDep, PlayerId
from app.api.schemas.errors import error_responses
from app.api.schemas.market import PurchaseRequest, PurchaseResponse, SaleResponse

router = APIRouter(prefix="/players", tags=["Mercado"])


@router.post(
    "/{player_id}/buy",
    summary="Compra um jogador livre pelo valor de mercado, com taxa e contrato (RN12 a RN14)",
    responses=error_responses(400, 404, 409),
)
def buy_player(
    player_id: PlayerId, payload: PurchaseRequest, service: MarketServiceDep
) -> PurchaseResponse:
    return PurchaseResponse.from_result(service.buy(player_id, payload))


@router.post(
    "/{player_id}/sell",
    summary="Vende o jogador pelo clube atual: multa, comissão e crédito (RN15 e RN16)",
    responses=error_responses(404, 409),
)
def sell_player(player_id: PlayerId, service: MarketServiceDep) -> SaleResponse:
    return SaleResponse.from_result(service.sell(player_id))
