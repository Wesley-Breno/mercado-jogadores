from enum import StrEnum


class Position(StrEnum):
    GOALKEEPER = "GOL"
    CENTER_BACK = "ZAG"
    FULL_BACK = "LAT"
    MIDFIELDER = "MEI"
    FORWARD = "ATA"


# RN07 and RN11: positions are ordered from back to front, not alphabetically.
POSITION_ORDER = (
    Position.GOALKEEPER,
    Position.CENTER_BACK,
    Position.FULL_BACK,
    Position.MIDFIELDER,
    Position.FORWARD,
)


def position_rank(position: Position) -> int:
    return POSITION_ORDER.index(position)


class Condition(StrEnum):
    FIT = "APTO"
    UNFIT = "MAL_CONDICIONADO"
    SICK = "DOENTE"


class ContractStatus(StrEnum):
    ACTIVE = "ATIVO"
    ENDED = "ENCERRADO"
    TERMINATED = "RESCINDIDO"


class TransactionType(StrEnum):
    PURCHASE = "COMPRA"
    SALE = "VENDA"


class Formation(StrEnum):
    THREE_ONE = "3-1"
    TWO_TWO = "2-2"
    TWO_ONE_ONE = "2-1-1"
    ONE_TWO_ONE = "1-2-1"
