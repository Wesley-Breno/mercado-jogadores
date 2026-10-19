from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import Condition, Position
from app.models.base import Base, enum_column_type


class Player(Base):
    __tablename__ = "jogadores"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column("nome", String(100))
    position: Mapped[Position] = mapped_column("posicao", enum_column_type(Position, 3))
    agility: Mapped[int] = mapped_column("agilidade")
    age: Mapped[int] = mapped_column("idade")
    base_value: Mapped[Decimal] = mapped_column("valor_base", Numeric(6, 2))
    condition: Mapped[Condition] = mapped_column("condicao", enum_column_type(Condition, 20))
    club_id: Mapped[int | None] = mapped_column("clube_id", ForeignKey("clubes.id"), index=True)
    pace: Mapped[int] = mapped_column("velocidade")
    shooting: Mapped[int] = mapped_column("finalizacao")
    passing: Mapped[int] = mapped_column("passe")
    dribbling: Mapped[int] = mapped_column("drible")
    defending: Mapped[int] = mapped_column("defesa")
    physical: Mapped[int] = mapped_column("fisico")
    potential: Mapped[int] = mapped_column("potencial")
    deleted_at: Mapped[datetime | None] = mapped_column("excluido_em")
    created_at: Mapped[datetime] = mapped_column("criado_em", server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        "atualizado_em", server_default=func.now(), onupdate=func.now()
    )
