import pytest
from sqlalchemy import Connection, Engine, inspect, text
from sqlalchemy.exc import IntegrityError

EXPECTED_COLUMNS = {
    "jogadores": {
        "id", "nome", "posicao", "agilidade", "idade", "valor_base", "condicao", "clube_id",
        "velocidade", "finalizacao", "passe", "drible", "defesa", "fisico", "potencial",
        "excluido_em", "criado_em", "atualizado_em",
    },
    "clubes": {"id", "nome", "sigla", "caixa", "formacao", "criado_em"},
    "contratos": {
        "id", "jogador_id", "clube_id", "valor_compra", "fidelidade_ate", "situacao",
        "iniciado_em", "encerrado_em",
    },
    "transacoes": {
        "id", "clube_id", "jogador_id", "nome_jogador", "tipo", "valor", "taxa", "multa", "lucro",
        "variacao_caixa", "criado_em",
    },
    "escalacoes": {"clube_id", "jogador_id", "criado_em"},
    "partidas": {
        "id", "mandante_id", "visitante_id", "gols_mandante", "gols_visitante",
        "formacao_mandante", "formacao_visitante", "jogada_em",
    },
    "duelos_partida": {
        "id", "partida_id", "ordem", "clube_atacante_id", "atacante_id", "defensor_id",
        "nome_atacante", "nome_defensor", "posicao_atacante", "posicao_defensor",
        "condicao_atacante", "condicao_defensor", "atributo_ataque", "atributo_defesa",
        "valor_ataque", "valor_defesa", "gol",
    },
}  # fmt: skip

MONEY_COLUMNS = {
    ("jogadores", "valor_base"): (6, 2),
    ("clubes", "caixa"): (10, 2),
    ("contratos", "valor_compra"): (6, 2),
    ("transacoes", "valor"): (6, 2),
    ("transacoes", "taxa"): (6, 2),
    ("transacoes", "multa"): (6, 2),
    ("transacoes", "lucro"): (7, 2),
    ("transacoes", "variacao_caixa"): (8, 2),
}

EXPECTED_FOREIGN_KEYS = {
    ("jogadores", "clube_id", "clubes"),
    ("contratos", "jogador_id", "jogadores"),
    ("contratos", "clube_id", "clubes"),
    ("transacoes", "clube_id", "clubes"),
    ("transacoes", "jogador_id", "jogadores"),
    ("escalacoes", "clube_id", "clubes"),
    ("escalacoes", "jogador_id", "jogadores"),
    ("partidas", "mandante_id", "clubes"),
    ("partidas", "visitante_id", "clubes"),
    ("duelos_partida", "partida_id", "partidas"),
    ("duelos_partida", "clube_atacante_id", "clubes"),
    ("duelos_partida", "atacante_id", "jogadores"),
    ("duelos_partida", "defensor_id", "jogadores"),
}


def insert_club(connection: Connection, name: str, acronym: str) -> int:
    return connection.scalar(
        text("INSERT INTO clubes (nome, sigla) VALUES (:name, :acronym) RETURNING id"),
        {"name": name, "acronym": acronym},
    )


def insert_player(connection: Connection, position: str = "MEI") -> int:
    return connection.scalar(
        text(
            "INSERT INTO jogadores (nome, posicao, agilidade, idade, valor_base, condicao,"
            " velocidade, finalizacao, passe, drible, defesa, fisico, potencial)"
            " VALUES ('Meia Lua', :position, 85, 25, 40.00, 'APTO', 70, 68, 82, 79, 55, 64, 86)"
            " RETURNING id"
        ),
        {"position": position},
    )


def insert_lineup_slot(connection: Connection, club_id: int, player_id: int) -> None:
    connection.execute(
        text(
            "INSERT INTO escalacoes (clube_id, jogador_id, criado_em)"
            " VALUES (:club_id, :player_id, now())"
        ),
        {"club_id": club_id, "player_id": player_id},
    )


def insert_contract(connection: Connection, player_id: int, club_id: int, status: str) -> None:
    connection.execute(
        text(
            "INSERT INTO contratos (jogador_id, clube_id, valor_compra, fidelidade_ate, situacao,"
            " iniciado_em) VALUES (:player_id, :club_id, 37.00, now() + interval '30 days',"
            " :status, now())"
        ),
        {"player_id": player_id, "club_id": club_id, "status": status},
    )


def test_tables_have_exactly_the_columns_of_the_statement(engine: Engine) -> None:
    inspector = inspect(engine)

    for table, columns in EXPECTED_COLUMNS.items():
        assert {column["name"] for column in inspector.get_columns(table)} == columns, table


@pytest.mark.parametrize(("table_column", "precision_scale"), MONEY_COLUMNS.items())
def test_money_columns_are_numeric_without_precision_loss(
    engine: Engine, table_column: tuple[str, str], precision_scale: tuple[int, int]
) -> None:
    table, column_name = table_column
    column = next(c for c in inspect(engine).get_columns(table) if c["name"] == column_name)

    assert (column["type"].precision, column["type"].scale) == precision_scale


def test_primary_keys(engine: Engine) -> None:
    inspector = inspect(engine)

    for table in EXPECTED_COLUMNS:
        expected = ["clube_id", "jogador_id"] if table == "escalacoes" else ["id"]
        assert inspector.get_pk_constraint(table)["constrained_columns"] == expected, table


def test_foreign_keys(engine: Engine) -> None:
    inspector = inspect(engine)

    found = {
        (table, fk["constrained_columns"][0], fk["referred_table"])
        for table in EXPECTED_COLUMNS
        for fk in inspector.get_foreign_keys(table)
    }

    assert found == EXPECTED_FOREIGN_KEYS


def test_club_name_is_unique_ignoring_case_but_not_accents(connection: Connection) -> None:
    insert_club(connection, "Águias FC", "AGU")

    with pytest.raises(IntegrityError), connection.begin_nested():
        insert_club(connection, "águias fc", "AGF")
    insert_club(connection, "Aguias FC", "AGI")


def test_club_acronym_is_unique(connection: Connection) -> None:
    insert_club(connection, "Águias FC", "AGU")

    with pytest.raises(IntegrityError), connection.begin_nested():
        insert_club(connection, "Gaviões do Litoral", "AGU")


def test_club_starts_with_300_in_cash(connection: Connection) -> None:
    club_id = insert_club(connection, "Águias FC", "AGU")

    cash = connection.scalar(text("SELECT caixa FROM clubes WHERE id = :id"), {"id": club_id})

    assert str(cash) == "300.00"


def test_player_is_in_at_most_one_lineup(connection: Connection) -> None:
    first_club = insert_club(connection, "Águias FC", "AGU")
    second_club = insert_club(connection, "Delta FC", "DEL")
    player_id = insert_player(connection)
    insert_lineup_slot(connection, first_club, player_id)

    with pytest.raises(IntegrityError), connection.begin_nested():
        insert_lineup_slot(connection, second_club, player_id)


def test_player_has_at_most_one_active_contract(connection: Connection) -> None:
    club_id = insert_club(connection, "Águias FC", "AGU")
    player_id = insert_player(connection)
    insert_contract(connection, player_id, club_id, "ENCERRADO")
    insert_contract(connection, player_id, club_id, "ATIVO")

    with pytest.raises(IntegrityError), connection.begin_nested():
        insert_contract(connection, player_id, club_id, "ATIVO")


def test_list_values_are_case_sensitive(connection: Connection) -> None:
    with pytest.raises(IntegrityError), connection.begin_nested():
        insert_player(connection, position="mei")
