import pytest

from app.domain.enums import Formation, Position
from app.domain.lineup import fits_formation

GOL, ZAG, LAT, MEI, ATA = (Position(code) for code in ("GOL", "ZAG", "LAT", "MEI", "ATA"))


@pytest.mark.parametrize(
    ("formation", "positions"),
    [
        # Exemplos de escalação da RN19, na ordem do elenco
        ("3-1", [GOL, ZAG, LAT, LAT, ATA]),
        ("2-2", [GOL, ZAG, LAT, ATA, ATA]),
        ("2-1-1", [GOL, ZAG, LAT, MEI, ATA]),
        ("1-2-1", [GOL, ZAG, MEI, MEI, ATA]),
        ("3-1", [GOL, ZAG, ZAG, ZAG, ATA]),
        ("2-2", [ATA, LAT, GOL, LAT, ATA]),
    ],
)
def test_positions_that_fit(formation: str, positions: list[Position]) -> None:
    assert fits_formation(Formation(formation), positions)


@pytest.mark.parametrize(
    ("formation", "positions"),
    [
        ("2-1-1", [GOL, GOL, LAT, MEI, ATA]),
        ("2-1-1", [ZAG, ZAG, LAT, MEI, ATA]),
        ("2-2", [GOL, ZAG, LAT, MEI, ATA]),
        ("3-1", [GOL, ZAG, LAT, MEI, ATA]),
        ("1-2-1", [GOL, ZAG, LAT, MEI, ATA]),
        ("2-1-1", [GOL, ZAG, MEI, MEI, ATA]),
    ],
)
def test_positions_that_do_not_fit(formation: str, positions: list[Position]) -> None:
    assert not fits_formation(Formation(formation), positions)
