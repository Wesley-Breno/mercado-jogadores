from datetime import datetime
from decimal import Decimal

from sqlalchemy import CHAR, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import Formation
from app.models.base import Base, enum_column_type


class Club(Base):
    __tablename__ = "clubes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column("nome", String(60))
    acronym: Mapped[str] = mapped_column("sigla", CHAR(3), unique=True)
    cash: Mapped[Decimal] = mapped_column("caixa", Numeric(10, 2), server_default="300.00")
    formation: Mapped[Formation | None] = mapped_column("formacao", enum_column_type(Formation, 5))
    created_at: Mapped[datetime] = mapped_column("criado_em", server_default=func.now())


# RN10: the name is stored after V4, so lower(nome) ignores letter case but keeps accents.
Index("uq_clubes_nome", func.lower(Club.name), unique=True)
