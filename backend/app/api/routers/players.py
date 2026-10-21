from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.deps import PlayerId, PlayerServiceDep
from app.api.params import player_list_query
from app.api.schemas.errors import error_responses
from app.api.schemas.players import (
    ConditionChange,
    PlayerCreate,
    PlayerPageResponse,
    PlayerResponse,
    PlayerUpdate,
)
from app.domain.player_listing import PlayerListQuery

router = APIRouter(prefix="/players", tags=["Jogadores"])


@router.get(
    "",
    summary="Lista jogadores com busca, filtros, ordenação e paginação (RN07)",
    responses=error_responses(400, 404),
)
def list_players(
    query: Annotated[PlayerListQuery, Depends(player_list_query)], service: PlayerServiceDep
) -> PlayerPageResponse:
    return PlayerPageResponse.from_page(service.list_players(query))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um jogador (valor base calculado pela RN06)",
    responses=error_responses(400),
)
def create_player(
    payload: PlayerCreate, request: Request, response: Response, service: PlayerServiceDep
) -> PlayerResponse:
    created = service.register(payload.to_new_player())
    response.headers["Location"] = str(
        request.app.url_path_for("get_player", player_id=str(created.player.id))
    )
    return PlayerResponse.from_valued(created)


@router.get(
    "/{player_id}",
    name="get_player",
    summary="Consulta um jogador, com overall e valor de mercado calculados na hora",
    responses=error_responses(404),
)
def get_player(player_id: PlayerId, service: PlayerServiceDep) -> PlayerResponse:
    return PlayerResponse.from_valued(service.get(player_id))


@router.put(
    "/{player_id}",
    summary="Edita nome, posição, agilidade e idade (RN08)",
    responses=error_responses(400, 404, 409),
)
def update_player(
    player_id: PlayerId, payload: PlayerUpdate, service: PlayerServiceDep
) -> PlayerResponse:
    return PlayerResponse.from_valued(service.update(player_id, payload.to_edit()))


@router.patch(
    "/{player_id}/condition",
    summary="Altera a condição física do jogador",
    responses=error_responses(400, 404, 409),
)
def change_condition(
    player_id: PlayerId, payload: ConditionChange, service: PlayerServiceDep
) -> PlayerResponse:
    return PlayerResponse.from_valued(service.change_condition(player_id, payload.condition))


@router.delete(
    "/{player_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Exclusão lógica de jogador livre (RN09)",
    responses=error_responses(404, 409),
)
def delete_player(player_id: PlayerId, service: PlayerServiceDep) -> None:
    service.delete(player_id)
