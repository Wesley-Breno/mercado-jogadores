from collections.abc import Sequence


def total_pages(total_items: int, limit: int) -> int:
    """RN07: total ÷ limit rounded up; 0 when there are no items."""
    return -(-total_items // limit)


def page_items[T](items: Sequence[T], page: int, limit: int) -> list[T]:
    """RN07: a page beyond the last one is simply empty."""
    start = (page - 1) * limit
    return list(items[start : start + limit])
