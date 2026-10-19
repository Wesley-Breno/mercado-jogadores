import re
from typing import Annotated

from pydantic import AfterValidator, BeforeValidator
from pydantic_core import PydanticCustomError

from app.domain.text import count_words, has_control_character, is_letter, normalize_spaces

INTEGER_MESSAGE = "deve ser um número inteiro."
PLAYER_NAME_MIN_LENGTH = 3
PLAYER_NAME_MAX_LENGTH = 100
PLAYER_NAME_MIN_WORDS = 2
CLUB_NAME_MIN_LENGTH = 3
CLUB_NAME_MAX_LENGTH = 60
CLUB_NAME_MIN_WORDS = 2
CLUB_NAME_MAX_WORDS = 5
CLUB_NAME_SYMBOLS = " -."
ACRONYM_PATTERN = re.compile(r"[A-Z]{3}")


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


def validate_club_name(value: str) -> str:
    name = clean_text(value)
    if not CLUB_NAME_MIN_LENGTH <= len(name) <= CLUB_NAME_MAX_LENGTH:
        raise ValueError(f"deve ter de {CLUB_NAME_MIN_LENGTH} a {CLUB_NAME_MAX_LENGTH} caracteres.")
    if any(not is_letter(char) and char not in CLUB_NAME_SYMBOLS for char in name):
        raise ValueError("só pode ter letras, espaços, hífen e ponto.")
    if not CLUB_NAME_MIN_WORDS <= count_words(name) <= CLUB_NAME_MAX_WORDS:
        raise ValueError(f"deve ter de {CLUB_NAME_MIN_WORDS} a {CLUB_NAME_MAX_WORDS} palavras.")
    return name


def validate_acronym(value: str) -> str:
    if not ACRONYM_PATTERN.fullmatch(value):
        raise ValueError("deve ter exatamente 3 letras de A a Z, maiúsculas e sem acento.")
    if len(set(value)) == 1:
        raise ValueError("as três letras não podem ser todas iguais.")
    return value


StrictInt = Annotated[int, BeforeValidator(parse_strict_integer)]
PlayerName = Annotated[str, AfterValidator(validate_player_name)]
ClubName = Annotated[str, AfterValidator(validate_club_name)]
Acronym = Annotated[str, AfterValidator(validate_acronym)]
