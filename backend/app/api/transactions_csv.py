import csv
import io
from collections.abc import Iterable
from decimal import Decimal

from app.api.schemas.common import format_brasilia
from app.models import Transaction

CSV_HEADER = (
    "data_hora",
    "tipo",
    "jogador",
    "valor",
    "taxa_ou_comissao",
    "multa",
    "lucro",
    "variacao_caixa",
)


def format_csv_money(value: Decimal | None) -> str:
    """RN18: 2 places with a decimal comma, "-" for negatives; empty when the value is null."""
    return "" if value is None else f"{value:.2f}".replace(".", ",")


def render_transactions_csv(transactions: Iterable[Transaction]) -> bytes:
    """RN18: ";" separator, quotes only when needed, LF on every line, UTF-8 without BOM."""
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";", lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(CSV_HEADER)
    for transaction in transactions:
        writer.writerow(
            (
                format_brasilia(transaction.created_at),
                transaction.type.value,
                transaction.player_name,
                format_csv_money(transaction.value),
                format_csv_money(transaction.fee),
                format_csv_money(transaction.penalty),
                format_csv_money(transaction.profit),
                format_csv_money(transaction.cash_change),
            )
        )
    return buffer.getvalue().encode("utf-8")
