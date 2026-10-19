from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Match(Base):
    __tablename__ = "partidas"

    id: Mapped[int] = mapped_column(primary_key=True)
    home_club_id: Mapped[int] = mapped_column("mandante_id", ForeignKey("clubes.id"), index=True)
    away_club_id: Mapped[int] = mapped_column("visitante_id", ForeignKey("clubes.id"), index=True)
    home_goals: Mapped[int] = mapped_column("gols_mandante")
    away_goals: Mapped[int] = mapped_column("gols_visitante")
    home_formation: Mapped[str] = mapped_column("formacao_mandante", String(5))
    away_formation: Mapped[str] = mapped_column("formacao_visitante", String(5))
    played_at: Mapped[datetime] = mapped_column("jogada_em")


class Duel(Base):
    """Snapshot of one duel: names, positions, conditions and values as they were at match time."""

    __tablename__ = "duelos_partida"

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column("partida_id", ForeignKey("partidas.id"), index=True)
    order: Mapped[int] = mapped_column("ordem")
    attacking_club_id: Mapped[int] = mapped_column("clube_atacante_id", ForeignKey("clubes.id"))
    attacker_id: Mapped[int] = mapped_column("atacante_id", ForeignKey("jogadores.id"))
    defender_id: Mapped[int] = mapped_column("defensor_id", ForeignKey("jogadores.id"))
    attacker_name: Mapped[str] = mapped_column("nome_atacante", String(100))
    defender_name: Mapped[str] = mapped_column("nome_defensor", String(100))
    attacker_position: Mapped[str] = mapped_column("posicao_atacante", String(3))
    defender_position: Mapped[str] = mapped_column("posicao_defensor", String(3))
    attacker_condition: Mapped[str] = mapped_column("condicao_atacante", String(20))
    defender_condition: Mapped[str] = mapped_column("condicao_defensor", String(20))
    attack_attribute: Mapped[str] = mapped_column("atributo_ataque", String(10))
    defense_attribute: Mapped[str] = mapped_column("atributo_defesa", String(10))
    attack_value: Mapped[int] = mapped_column("valor_ataque")
    defense_value: Mapped[int] = mapped_column("valor_defesa")
    goal: Mapped[bool] = mapped_column("gol")
