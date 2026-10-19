from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.deps import PlayerId, PlayerServiceDep
from app.api.params import player_list_query
from app.api.schemas.players import PlayerCreate, PlayerPageResponse, PlayerResponse
from app.domain.player_listing import PlayerListQuery

router = APIRouter(prefix="/players", tags=["Jogadores"])


@router.get("", summary="Lista jogadores com busca, filtros, ordenação e paginação (RN07)")
def list_players(
    query: Annotated[PlayerListQuery, Depends(player_list_query)], service: PlayerServiceDep
) -> PlayerPageResponse:
    return PlayerPageResponse.from_page(service.list_players(query))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um jogador (valor base calculado pela RN06)",
)
def create_player(
    payload: PlayerCreate, request: Request, response: Response, service: PlayerServiceDep
) -> PlayerResponse:
    created = service.register(payload)
    response.headers["Location"] = str(
        request.app.url_path_for("get_player", player_id=str(created.player.id))
    )
    return PlayerResponse.from_valued(created)


@router.get(
    "/{player_id}",
    name="get_player",
    summary="Consulta um jogador, com overall e valor de mercado calculados na hora",
)
def get_player(player_id: PlayerId, service: PlayerServiceDep) -> PlayerResponse:
    return PlayerResponse.from_valued(service.get(player_id))
