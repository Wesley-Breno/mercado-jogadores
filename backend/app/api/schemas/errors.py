from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    message: str = Field(examples=["Jogador não encontrado."])


_DESCRIPTIONS = {
    400: "Dado ou parâmetro inválido",
    404: "Recurso inexistente, ou id fora do formato",
    409: "Regra de negócio violada",
}


def error_responses(*codes: int) -> dict[int | str, dict[str, Any]]:
    """The error answers of a route for the API docs: every one is `{"message": ...}`."""
    return {code: {"model": ErrorResponse, "description": _DESCRIPTIONS[code]} for code in codes}
