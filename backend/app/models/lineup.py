from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class LineupSlot(Base):
    __tablename__ = "escalacoes"

    club_id: Mapped[int] = mapped_column("clube_id", ForeignKey("clubes.id"), primary_key=True)
    player_id: Mapped[int] = mapped_column(
        "jogador_id", ForeignKey("jogadores.id"), primary_key=True, unique=True
    )
    created_at: Mapped[datetime] = mapped_column("criado_em")
