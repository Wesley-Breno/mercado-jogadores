from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import TransactionType
from app.models.base import Base, enum_column_type


class Transaction(Base):
    __tablename__ = "transacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    club_id: Mapped[int] = mapped_column("clube_id", ForeignKey("clubes.id"), index=True)
    player_id: Mapped[int] = mapped_column("jogador_id", ForeignKey("jogadores.id"), index=True)
    player_name: Mapped[str] = mapped_column("nome_jogador", String(100))
    type: Mapped[TransactionType] = mapped_column("tipo", enum_column_type(TransactionType, 6))
    value: Mapped[Decimal] = mapped_column("valor", Numeric(6, 2))
    fee: Mapped[Decimal] = mapped_column("taxa", Numeric(6, 2))
    penalty: Mapped[Decimal] = mapped_column("multa", Numeric(6, 2))
    profit: Mapped[Decimal | None] = mapped_column("lucro", Numeric(7, 2))
    cash_change: Mapped[Decimal] = mapped_column("variacao_caixa", Numeric(8, 2))
    created_at: Mapped[datetime] = mapped_column("criado_em")
