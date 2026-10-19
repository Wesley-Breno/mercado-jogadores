from datetime import datetime
from enum import StrEnum
from typing import Any, ClassVar

from sqlalchemy import DateTime, Enum, MetaData
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeEngine

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    type_annotation_map: ClassVar[dict[Any, TypeEngine[Any]]] = {
        datetime: DateTime(timezone=True),
    }


def enum_column_type(enum_class: type[StrEnum], length: int) -> Enum:
    """VARCHAR with a CHECK constraint listing the enum values exactly as the API writes them."""
    return Enum(
        enum_class,
        name=enum_class.__name__.lower(),
        native_enum=False,
        create_constraint=True,
        length=length,
        values_callable=lambda members: [member.value for member in members],
        validate_strings=True,
    )
