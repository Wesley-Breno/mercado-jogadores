from typing import Annotated

from pydantic import AfterValidator, BeforeValidator
from pydantic_core import PydanticCustomError

from app.domain.text import count_words, has_control_character, normalize_spaces

INTEGER_MESSAGE = "deve ser um número inteiro."
PLAYER_NAME_MIN_LENGTH = 3
PLAYER_NAME_MAX_LENGTH = 100
PLAYER_NAME_MIN_WORDS = 2


def parse_strict_integer(value: object) -> int:
    """V2: a JSON number without fraction; 50.0 counts as 50, but booleans, text and 50.5 do not."""
    if value is None:
        raise PydanticCustomError("missing", "Campo obrigatório.")
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise ValueError(INTEGER_MESSAGE)
    if isinstance(value, float) and not value.is_integer():
        raise ValueError(INTEGER_MESSAGE)
    return int(value)


def clean_text(value: str) -> str:
    """V4: refuses control characters, normalizes spaces and treats an empty result as absent."""
    if has_control_character(value):
        raise ValueError("não pode ter caracteres de controle, como tabulação ou quebra de linha.")
    text = normalize_spaces(value)
    if not text:
        raise PydanticCustomError("missing", "Campo obrigatório.")
    return text


def validate_player_name(value: str) -> str:
    name = clean_text(value)
    if not PLAYER_NAME_MIN_LENGTH <= len(name) <= PLAYER_NAME_MAX_LENGTH:
        raise ValueError(
            f"deve ter de {PLAYER_NAME_MIN_LENGTH} a {PLAYER_NAME_MAX_LENGTH} caracteres."
        )
    if any("0" <= char <= "9" for char in name):
        raise ValueError("não pode ter dígitos.")
    if count_words(name) < PLAYER_NAME_MIN_WORDS:
        raise ValueError("deve ter pelo menos duas palavras.")
    return name


StrictInt = Annotated[int, BeforeValidator(parse_strict_integer)]
PlayerName = Annotated[str, AfterValidator(validate_player_name)]
