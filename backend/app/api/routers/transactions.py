from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.api.deps import ClubId, TransactionServiceDep
from app.api.params import transaction_filters
from app.api.schemas.transactions import TransactionHistoryResponse
from app.api.transactions_csv import render_transactions_csv
from app.domain.transaction_filters import TransactionFilters

router = APIRouter(prefix="/clubs", tags=["Histórico"])

Filters = Annotated[TransactionFilters, Depends(transaction_filters)]


@router.get(
    "/{club_id}/transactions",
    summary="Histórico de compras e vendas do clube, com summary (RN17)",
)
def list_transactions(
    club_id: ClubId, filters: Filters, service: TransactionServiceDep
) -> TransactionHistoryResponse:
    return TransactionHistoryResponse.from_history(service.history(club_id, filters))


@router.get(
    "/{club_id}/transactions/export",
    summary="Histórico do clube em CSV, com os mesmos filtros (RN18)",
    response_class=Response,
    responses={200: {"content": {"text/csv": {}}, "description": "Arquivo CSV"}},
)
def export_transactions(
    club_id: ClubId, filters: Filters, service: TransactionServiceDep
) -> Response:
    history = service.history(club_id, filters)
    return Response(
        content=render_transactions_csv(history.transactions),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="transacoes-clube-{club_id}.csv"'},
    )
