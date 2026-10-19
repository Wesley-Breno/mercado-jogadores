import pytest

from app.domain.text import (
    alphabetical_key,
    count_words,
    has_control_character,
    matches_search,
    normalize_spaces,
    strip_accents,
)


@pytest.mark.parametrize(
    ("raw", "normalized"),
    [
        ("  Meia   Zeta ", "Meia Zeta"),
        ("Meia Lua", "Meia Lua"),
        ("   ", ""),
        ("Zé\u00a0 Lima", "Zé\u00a0 Lima"),
    ],
    ids=["espacos-repetidos", "ja-normalizado", "so-espacos", "nbsp-nao-e-espaco"],
)
def test_normalize_spaces_handles_only_u0020(raw: str, normalized: str) -> None:
    assert normalize_spaces(raw) == normalized


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Meia\tZeta", True),
        ("Meia\nZeta", True),
        ("Meia\x00Zeta", True),
        ("Meia Zeta", False),
        ("Zé\u00a0Lima", False),
    ],
)
def test_detects_control_characters(text: str, expected: bool) -> None:
    assert has_control_character(text) is expected


def test_strip_accents_removes_marks_including_cedilla() -> None:
    assert strip_accents("Águias Ébano Ção Ñandu") == "Aguias Ebano Cao Nandu"


@pytest.mark.parametrize(
    ("names", "ordered"),
    [
        (["Gama", "Épsilon", "Delta"], ["Delta", "Épsilon", "Gama"]),
        (["Ana-Maria", "Ana Lima"], ["Ana Lima", "Ana-Maria"]),
        (["beta", "Alfa", "Ágata"], ["Ágata", "Alfa", "beta"]),
    ],
)
def test_alphabetical_order_ignores_case_and_accents(names: list[str], ordered: list[str]) -> None:
    assert sorted(names, key=alphabetical_key) == ordered


def test_names_equal_without_accents_tie() -> None:
    assert alphabetical_key("Águias FC") == alphabetical_key("Aguias FC")


@pytest.mark.parametrize(
    ("name", "term", "expected"),
    [
        ("João Silva", "joao", True),
        ("Meia Lua", "LUA", True),
        ("Meia Lua", "ia l", True),
        ("Meia Lua", "sol", False),
    ],
)
def test_search_ignores_case_and_accents(name: str, term: str, expected: bool) -> None:
    assert matches_search(name, term) is expected


@pytest.mark.parametrize(
    ("text", "words"),
    [
        ("Meia Lua", 2),
        ("A. B.", 2),
        ("Zé -", 1),
        ("Zé", 1),
        ("São Paulo F. C.", 4),
    ],
)
def test_word_needs_at_least_one_letter(text: str, words: int) -> None:
    assert count_words(text) == words
