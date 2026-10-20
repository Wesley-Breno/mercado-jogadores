"""B09: a liga aceita no máximo 20 clubes (roda por último, porque enche a liga)."""

import httpx2

from conformance.support import create_club

FILLERS = "BCDEFGHIJKLMNOPQRSTU"


def test_b09_the_21st_club_is_refused(api: httpx2.Client) -> None:
    existing = len(api.get("/clubs").json())
    for letter in FILLERS[: 20 - existing]:
        create_club(api, f"Clube Extra {letter}", f"CE{letter}")

    response = api.post("/clubs", json={"name": "Clube Extra Z", "acronym": "CEZ"})

    assert response.status_code == 409
    assert response.json()["message"]
    assert len(api.get("/clubs").json()) == 20
