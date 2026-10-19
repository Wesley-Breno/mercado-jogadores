import re
import unicodedata

SPACE = " "
REPEATED_SPACES = re.compile(" {2,}")


def normalize_spaces(text: str) -> str:
    """V4: removes U+0020 from both ends and turns repeated U+0020 into a single one."""
    return REPEATED_SPACES.sub(SPACE, text.strip(SPACE))


def has_control_character(text: str) -> bool:
    return any(unicodedata.category(char) == "Cc" for char in text)


def is_letter(char: str) -> bool:
    return unicodedata.category(char).startswith("L")


def strip_accents(text: str) -> str:
    """NFD decomposition without the combining marks (category Mn), so "ç" becomes "c"."""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def alphabetical_key(name: str) -> str:
    """Premissas: lowercase, no accents, compared by code point (space < hyphen < letters)."""
    return strip_accents(name.lower())


def matches_search(name: str, term: str) -> bool:
    """RN07: the term is searched inside the name, ignoring letter case and accents."""
    return alphabetical_key(term) in alphabetical_key(name)


def count_words(text: str) -> int:
    """A word is a sequence without spaces that has at least one letter."""
    return sum(1 for token in text.split(SPACE) if any(is_letter(char) for char in token))
