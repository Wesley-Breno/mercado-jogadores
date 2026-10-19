"""Strict parsing of query params ("Filtros e query params aceitos"): any other form is a 400."""

import re
from collections.abc import Callable
from decimal import Decimal
from enum import StrEnum
from functools import partial
from typing import Annotated

from fastapi import Query

from app.core.errors import BadRequestError
from app.domain.club_rules import ClubSort
from app.domain.enums import Condition, Position, TransactionType
from app.domain.player_listing import (
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
    MAX_LIMIT,
    MAX_SORT_CRITERIA,
    MAX_VALUE_FILTER,
    MIN_VALUE_FILTER,
    SORT_OPTIONS,
    PlayerListQuery,
    SortCriterion,
)
from app.domain.player_rules import MAX_AGE, MIN_AGE
from app.domain.text import has_control_character, normalize_spaces
from app.domain.transaction_filters import TransactionFilters

POSITIVE_INTEGER = re.compile(r"[1-9][0-9]*")
DECIMAL_VALUE = re.compile(r"(0|[1-9][0-9]*)(\.[0-9]{1,2})?")
BOOLEAN_VALUES = {"true": True, "false": False}
SEARCH_MIN_LENGTH = 2
SEARCH_MAX_LENGTH = 100


def invalid(name: str, rule: str) -> BadRequestError:
    return BadRequestError(f"Parâmetro '{name}' inválido: {rule}")


def parse_positive_int(name: str, raw: str) -> int:
    if not POSITIVE_INTEGER.fullmatch(raw):
        raise invalid(name, "use um inteiro positivo, só com dígitos e sem zeros à esquerda.")
    return int(raw)


def parse_bounded_int(name: str, raw: str, minimum: int, maximum: int) -> int:
    value = parse_positive_int(name, raw)
    if not minimum <= value <= maximum:
        raise invalid(name, f"use um valor de {minimum} a {maximum}.")
    return value


def parse_age(name: str, raw: str) -> int:
    return parse_bounded_int(name, raw, MIN_AGE, MAX_AGE)


def parse_limit(name: str, raw: str) -> int:
    return parse_bounded_int(name, raw, 1, MAX_LIMIT)


def parse_money(name: str, raw: str) -> Decimal:
    if not DECIMAL_VALUE.fullmatch(raw):
        raise invalid(name, "use um número como 10, 10.5 ou 10.55, sem sinal e sem vírgula.")
    value = Decimal(raw)
    if not MIN_VALUE_FILTER <= value <= MAX_VALUE_FILTER:
        raise invalid(name, f"use um valor de {MIN_VALUE_FILTER} a {MAX_VALUE_FILTER}.")
    return value


def parse_choice[E: StrEnum](name: str, raw: str, choices: type[E]) -> E:
    if raw not in {choice.value for choice in choices}:
        accepted = ", ".join(choice.value for choice in choices)
        raise invalid(name, f"use um destes valores: {accepted}.")
    return choices(raw)


def parse_boolean(name: str, raw: str) -> bool:
    if raw not in BOOLEAN_VALUES:
        raise invalid(name, "use true ou false.")
    return BOOLEAN_VALUES[raw]


def parse_search(raw: str) -> str:
    if has_control_character(raw):
        raise invalid("search", "não use caracteres de controle.")
    term = normalize_spaces(raw)
    if not SEARCH_MIN_LENGTH <= len(term) <= SEARCH_MAX_LENGTH:
        raise invalid("search", f"use de {SEARCH_MIN_LENGTH} a {SEARCH_MAX_LENGTH} caracteres.")
    return term


def parse_sort(raw: str) -> tuple[SortCriterion, ...]:
    names = raw.split(",")
    if len(names) > MAX_SORT_CRITERIA or any(name not in SORT_OPTIONS for name in names):
        accepted = ", ".join(SORT_OPTIONS)
        raise invalid(
            "sort", f"use até {MAX_SORT_CRITERIA} destes valores, sem espaços: {accepted}."
        )
    criteria = tuple(SORT_OPTIONS[name] for name in names)
    if len({criterion.field for criterion in criteria}) < len(criteria):
        raise invalid("sort", "não repita o mesmo campo.")
    return criteria


def parse_optional[T](raw: str | None, parse: Callable[[str], T], default: T) -> T:
    """An absent param uses the default; a present one, even empty, must be valid."""
    return default if raw is None else parse(raw)


def check_range[T: (int, Decimal)](minimum: T, maximum: T, names: str) -> None:
    if minimum > maximum:
        raise BadRequestError(f"Faixa inválida em {names}: o mínimo é maior que o máximo.")


def player_list_query(
    search: Annotated[
        str | None, Query(description="Texto no nome, sem diferenciar acentos")
    ] = None,
    position: Annotated[str | None, Query(description="GOL, ZAG, LAT, MEI ou ATA")] = None,
    condition: Annotated[str | None, Query(description="APTO, MAL_CONDICIONADO ou DOENTE")] = None,
    free: Annotated[str | None, Query(description="true: só livres; false: só com clube")] = None,
    club_id: Annotated[str | None, Query(description="Só os jogadores desse clube")] = None,
    min_age: Annotated[str | None, Query(description="Idade mínima (16 a 45)")] = None,
    max_age: Annotated[str | None, Query(description="Idade máxima (16 a 45)")] = None,
    min_value: Annotated[str | None, Query(description="Valor de mercado mínimo (0 a 550)")] = None,
    max_value: Annotated[str | None, Query(description="Valor de mercado máximo (0 a 550)")] = None,
    sort: Annotated[str | None, Query(description="Até 2 critérios, separados por vírgula")] = None,
    page: Annotated[str | None, Query(description="Página, a partir de 1")] = None,
    limit: Annotated[str | None, Query(description="Itens por página, de 1 a 50")] = None,
) -> PlayerListQuery:
    query = PlayerListQuery(
        search=parse_optional(search, parse_search, None),
        position=parse_optional(
            position, partial(parse_choice, "position", choices=Position), None
        ),
        condition=parse_optional(
            condition, partial(parse_choice, "condition", choices=Condition), None
        ),
        free=parse_optional(free, partial(parse_boolean, "free"), None),
        club_id=parse_optional(club_id, partial(parse_positive_int, "club_id"), None),
        min_age=parse_optional(min_age, partial(parse_age, "min_age"), MIN_AGE),
        max_age=parse_optional(max_age, partial(parse_age, "max_age"), MAX_AGE),
        min_value=parse_optional(min_value, partial(parse_money, "min_value"), MIN_VALUE_FILTER),
        max_value=parse_optional(max_value, partial(parse_money, "max_value"), MAX_VALUE_FILTER),
        sort=parse_optional(sort, parse_sort, (SORT_OPTIONS["name"],)),
        page=parse_optional(page, partial(parse_positive_int, "page"), DEFAULT_PAGE),
        limit=parse_optional(limit, partial(parse_limit, "limit"), DEFAULT_LIMIT),
    )
    check_range(query.min_age, query.max_age, "min_age e max_age")
    check_range(query.min_value, query.max_value, "min_value e max_value")
    if query.free is True and query.club_id is not None:
        raise BadRequestError(
            "Combinação inválida: free=true não pode ser usado junto com club_id."
        )
    return query


def club_sort(
    sort: Annotated[str | None, Query(description="name, net_worth_asc ou net_worth_desc")] = None,
) -> ClubSort:
    """RN11: a single value; unlike the player list, it does not take two criteria."""
    return parse_optional(sort, partial(parse_choice, "sort", choices=ClubSort), ClubSort.NAME)


def match_club_filter(
    club_id: Annotated[str | None, Query(description="Partidas em que o clube jogou")] = None,
) -> int | None:
    return parse_optional(club_id, partial(parse_positive_int, "club_id"), None)


def parse_transaction_types(raw: str) -> frozenset[TransactionType]:
    """One or more of COMPRA and VENDA, separated by commas, without spaces or repetition."""
    names = raw.split(",")
    accepted = {kind.value for kind in TransactionType}
    if any(name not in accepted for name in names) or len(set(names)) < len(names):
        raise invalid("type", "use COMPRA, VENDA ou COMPRA,VENDA, sem espaços e sem repetir.")
    return frozenset(TransactionType(name) for name in names)


def transaction_filters(
    type: Annotated[
        str | None, Query(description="COMPRA, VENDA ou os dois, separados por vírgula")
    ] = None,
    player_id: Annotated[str | None, Query(description="Só as transações desse jogador")] = None,
) -> TransactionFilters:
    return TransactionFilters(
        types=parse_optional(type, parse_transaction_types, None),
        player_id=parse_optional(player_id, partial(parse_positive_int, "player_id"), None),
    )
