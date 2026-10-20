import os
from collections.abc import Iterator

import httpx2
import pytest

API_URL = os.environ.get("CONFORMANCE_API_URL", "http://localhost:8000/api/v1")


@pytest.fixture(scope="session")
def api() -> Iterator[httpx2.Client]:
    """The API that is running, as the grading script sees it; the league must start empty."""
    with httpx2.Client(base_url=API_URL, timeout=15, follow_redirects=False) as client:
        clubs = client.get("/clubs").json()
        players = client.get("/players?limit=1").json()
        if clubs or players["meta"]["total_items"]:
            pytest.exit(
                "A suíte de conformidade parte do banco recriado: rode "
                '"docker compose exec backend alembic downgrade base" e '
                '"docker compose exec backend alembic upgrade head" antes.',
                returncode=2,
            )
        yield client
