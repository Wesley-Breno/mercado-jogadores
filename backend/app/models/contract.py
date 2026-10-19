from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Numeric, text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import ContractStatus
from app.models.base import Base, enum_column_type


class Contract(Base):
    __tablename__ = "contratos"
    __table_args__ = (
        Index(
            "uq_contratos_jogador_ativo",
            "jogador_id",
            unique=True,
            postgresql_where=text("situacao = 'ATIVO'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column("jogador_id", ForeignKey("jogadores.id"), index=True)
    club_id: Mapped[int] = mapped_column("clube_id", ForeignKey("clubes.id"), index=True)
    purchase_value: Mapped[Decimal] = mapped_column("valor_compra", Numeric(6, 2))
    loyalty_until: Mapped[datetime] = mapped_column("fidelidade_ate")
    status: Mapped[ContractStatus] = mapped_column("situacao", enum_column_type(ContractStatus, 12))
    started_at: Mapped[datetime] = mapped_column("iniciado_em")
    ended_at: Mapped[datetime | None] = mapped_column("encerrado_em")
