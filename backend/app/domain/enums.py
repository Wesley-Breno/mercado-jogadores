from enum import StrEnum


class Position(StrEnum):
    GOALKEEPER = "GOL"
    CENTER_BACK = "ZAG"
    FULL_BACK = "LAT"
    MIDFIELDER = "MEI"
    FORWARD = "ATA"


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
