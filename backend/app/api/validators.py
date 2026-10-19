import re
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BeforeValidator, Field
from pydantic_core import PydanticCustomError

from app.core.clock import BRASILIA_TZ
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
BRASILIA_INPUT_PATTERN = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}-03:00")
BRASILIA_INPUT_FORMAT = "%Y-%m-%dT%H:%M-03:00"


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


def parse_brasilia_datetime(value: object) -> datetime:
    """RN01: only AAAA-MM-DDTHH:MM-03:00 with a real date and time; nothing is adjusted."""
    if value is None:
        raise PydanticCustomError("missing", "Campo obrigatório.")
    if not isinstance(value, str) or not BRASILIA_INPUT_PATTERN.fullmatch(value):
        raise ValueError("use o formato AAAA-MM-DDTHH:MM-03:00, no horário de Brasília.")
    try:
        moment = datetime.strptime(value, BRASILIA_INPUT_FORMAT)
    except ValueError as error:
        raise ValueError("data ou hora inexistente.") from error
    return moment.replace(tzinfo=BRASILIA_TZ)


StrictInt = Annotated[int, BeforeValidator(parse_strict_integer)]
PositiveId = Annotated[StrictInt, Field(ge=1)]
PlayerName = Annotated[str, AfterValidator(validate_player_name)]
ClubName = Annotated[str, AfterValidator(validate_club_name)]
Acronym = Annotated[str, AfterValidator(validate_acronym)]
BrasiliaInputDateTime = Annotated[datetime, BeforeValidator(parse_brasilia_datetime)]
