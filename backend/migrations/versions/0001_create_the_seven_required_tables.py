"""create the seven required tables

Revision ID: 0001
Revises:
Create Date: 2026-10-18 22:45:21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TIMESTAMP = sa.DateTime(timezone=True)


def money(precision: int) -> sa.Numeric:
    return sa.Numeric(precision=precision, scale=2)


def upgrade() -> None:
    op.create_table(
        "clubes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(60), nullable=False),
        sa.Column("sigla", sa.CHAR(3), nullable=False),
        sa.Column("caixa", money(10), server_default="300.00", nullable=False),
        sa.Column("formacao", sa.String(5), nullable=True),
        sa.Column("criado_em", TIMESTAMP, server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "formacao IN ('3-1', '2-2', '2-1-1', '1-2-1')", name=op.f("ck_clubes_formation")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_clubes")),
        sa.UniqueConstraint("sigla", name=op.f("uq_clubes_sigla")),
    )
    op.create_index("uq_clubes_nome", "clubes", [sa.literal_column("lower(nome)")], unique=True)

    op.create_table(
        "jogadores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(100), nullable=False),
        sa.Column("posicao", sa.String(3), nullable=False),
        sa.Column("agilidade", sa.Integer(), nullable=False),
        sa.Column("idade", sa.Integer(), nullable=False),
        sa.Column("valor_base", money(6), nullable=False),
        sa.Column("condicao", sa.String(20), nullable=False),
        sa.Column("clube_id", sa.Integer(), nullable=True),
        sa.Column("velocidade", sa.Integer(), nullable=False),
        sa.Column("finalizacao", sa.Integer(), nullable=False),
        sa.Column("passe", sa.Integer(), nullable=False),
        sa.Column("drible", sa.Integer(), nullable=False),
        sa.Column("defesa", sa.Integer(), nullable=False),
        sa.Column("fisico", sa.Integer(), nullable=False),
        sa.Column("potencial", sa.Integer(), nullable=False),
        sa.Column("excluido_em", TIMESTAMP, nullable=True),
        sa.Column("criado_em", TIMESTAMP, server_default=sa.text("now()"), nullable=False),
        sa.Column("atualizado_em", TIMESTAMP, server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "posicao IN ('GOL', 'ZAG', 'LAT', 'MEI', 'ATA')", name=op.f("ck_jogadores_position")
        ),
        sa.CheckConstraint(
            "condicao IN ('APTO', 'MAL_CONDICIONADO', 'DOENTE')",
            name=op.f("ck_jogadores_condition"),
        ),
        sa.ForeignKeyConstraint(
            ["clube_id"], ["clubes.id"], name=op.f("fk_jogadores_clube_id_clubes")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_jogadores")),
    )
    op.create_index(op.f("ix_jogadores_clube_id"), "jogadores", ["clube_id"])

    op.create_table(
        "contratos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("jogador_id", sa.Integer(), nullable=False),
        sa.Column("clube_id", sa.Integer(), nullable=False),
        sa.Column("valor_compra", money(6), nullable=False),
        sa.Column("fidelidade_ate", TIMESTAMP, nullable=False),
        sa.Column("situacao", sa.String(12), nullable=False),
        sa.Column("iniciado_em", TIMESTAMP, nullable=False),
        sa.Column("encerrado_em", TIMESTAMP, nullable=True),
        sa.CheckConstraint(
            "situacao IN ('ATIVO', 'ENCERRADO', 'RESCINDIDO')",
            name=op.f("ck_contratos_contractstatus"),
        ),
        sa.ForeignKeyConstraint(
            ["clube_id"], ["clubes.id"], name=op.f("fk_contratos_clube_id_clubes")
        ),
        sa.ForeignKeyConstraint(
            ["jogador_id"], ["jogadores.id"], name=op.f("fk_contratos_jogador_id_jogadores")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contratos")),
    )
    op.create_index(op.f("ix_contratos_clube_id"), "contratos", ["clube_id"])
    op.create_index(op.f("ix_contratos_jogador_id"), "contratos", ["jogador_id"])
    op.create_index(
        "uq_contratos_jogador_ativo",
        "contratos",
        ["jogador_id"],
        unique=True,
        postgresql_where=sa.text("situacao = 'ATIVO'"),
    )

    op.create_table(
        "transacoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clube_id", sa.Integer(), nullable=False),
        sa.Column("jogador_id", sa.Integer(), nullable=False),
        sa.Column("nome_jogador", sa.String(100), nullable=False),
        sa.Column("tipo", sa.String(6), nullable=False),
        sa.Column("valor", money(6), nullable=False),
        sa.Column("taxa", money(6), nullable=False),
        sa.Column("multa", money(6), nullable=False),
        sa.Column("lucro", money(7), nullable=True),
        sa.Column("variacao_caixa", money(8), nullable=False),
        sa.Column("criado_em", TIMESTAMP, nullable=False),
        sa.CheckConstraint(
            "tipo IN ('COMPRA', 'VENDA')", name=op.f("ck_transacoes_transactiontype")
        ),
        sa.ForeignKeyConstraint(
            ["clube_id"], ["clubes.id"], name=op.f("fk_transacoes_clube_id_clubes")
        ),
        sa.ForeignKeyConstraint(
            ["jogador_id"], ["jogadores.id"], name=op.f("fk_transacoes_jogador_id_jogadores")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_transacoes")),
    )
    op.create_index(op.f("ix_transacoes_clube_id"), "transacoes", ["clube_id"])
    op.create_index(op.f("ix_transacoes_jogador_id"), "transacoes", ["jogador_id"])

    op.create_table(
        "escalacoes",
        sa.Column("clube_id", sa.Integer(), nullable=False),
        sa.Column("jogador_id", sa.Integer(), nullable=False),
        sa.Column("criado_em", TIMESTAMP, nullable=False),
        sa.ForeignKeyConstraint(
            ["clube_id"], ["clubes.id"], name=op.f("fk_escalacoes_clube_id_clubes")
        ),
        sa.ForeignKeyConstraint(
            ["jogador_id"], ["jogadores.id"], name=op.f("fk_escalacoes_jogador_id_jogadores")
        ),
        sa.PrimaryKeyConstraint("clube_id", "jogador_id", name=op.f("pk_escalacoes")),
        sa.UniqueConstraint("jogador_id", name=op.f("uq_escalacoes_jogador_id")),
    )

    op.create_table(
        "partidas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("mandante_id", sa.Integer(), nullable=False),
        sa.Column("visitante_id", sa.Integer(), nullable=False),
        sa.Column("gols_mandante", sa.Integer(), nullable=False),
        sa.Column("gols_visitante", sa.Integer(), nullable=False),
        sa.Column("formacao_mandante", sa.String(5), nullable=False),
        sa.Column("formacao_visitante", sa.String(5), nullable=False),
        sa.Column("jogada_em", TIMESTAMP, nullable=False),
        sa.ForeignKeyConstraint(
            ["mandante_id"], ["clubes.id"], name=op.f("fk_partidas_mandante_id_clubes")
        ),
        sa.ForeignKeyConstraint(
            ["visitante_id"], ["clubes.id"], name=op.f("fk_partidas_visitante_id_clubes")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_partidas")),
    )
    op.create_index(op.f("ix_partidas_mandante_id"), "partidas", ["mandante_id"])
    op.create_index(op.f("ix_partidas_visitante_id"), "partidas", ["visitante_id"])

    op.create_table(
        "duelos_partida",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("partida_id", sa.Integer(), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.Column("clube_atacante_id", sa.Integer(), nullable=False),
        sa.Column("atacante_id", sa.Integer(), nullable=False),
        sa.Column("defensor_id", sa.Integer(), nullable=False),
        sa.Column("nome_atacante", sa.String(100), nullable=False),
        sa.Column("nome_defensor", sa.String(100), nullable=False),
        sa.Column("posicao_atacante", sa.String(3), nullable=False),
        sa.Column("posicao_defensor", sa.String(3), nullable=False),
        sa.Column("condicao_atacante", sa.String(20), nullable=False),
        sa.Column("condicao_defensor", sa.String(20), nullable=False),
        sa.Column("atributo_ataque", sa.String(10), nullable=False),
        sa.Column("atributo_defesa", sa.String(10), nullable=False),
        sa.Column("valor_ataque", sa.Integer(), nullable=False),
        sa.Column("valor_defesa", sa.Integer(), nullable=False),
        sa.Column("gol", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["partida_id"], ["partidas.id"], name=op.f("fk_duelos_partida_partida_id_partidas")
        ),
        sa.ForeignKeyConstraint(
            ["clube_atacante_id"],
            ["clubes.id"],
            name=op.f("fk_duelos_partida_clube_atacante_id_clubes"),
        ),
        sa.ForeignKeyConstraint(
            ["atacante_id"],
            ["jogadores.id"],
            name=op.f("fk_duelos_partida_atacante_id_jogadores"),
        ),
        sa.ForeignKeyConstraint(
            ["defensor_id"],
            ["jogadores.id"],
            name=op.f("fk_duelos_partida_defensor_id_jogadores"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_duelos_partida")),
    )
    op.create_index(op.f("ix_duelos_partida_partida_id"), "duelos_partida", ["partida_id"])


def downgrade() -> None:
    op.drop_table("duelos_partida")
    op.drop_table("partidas")
    op.drop_table("escalacoes")
    op.drop_table("transacoes")
    op.drop_table("contratos")
    op.drop_table("jogadores")
    op.drop_table("clubes")
