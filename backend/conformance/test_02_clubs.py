"""B09: club creation, initial cash, unique name and acronym, and order by name."""

import httpx2
import pytest

from conformance.support import create_club


def test_b09_club_starts_with_300_and_location(api: httpx2.Client) -> None:
    response = api.post("/clubs", json={"name": "Gaviões FC", "acronym": "GFC", "cash": 1000})

    body = response.json()
    assert response.status_code == 201
    assert response.headers["location"].endswith(f"/api/v1/clubs/{body['id']}")
    assert (body["cash"], body["squad_value"], body["net_worth"]) == (300.0, 0.0, 300.0)
    assert api.get(f"/clubs/{body['id']}").json()["players"] == []


def test_b09_name_is_unique_ignoring_case_but_not_accents(api: httpx2.Client) -> None:
    repeated = api.post("/clubs", json={"name": "  gaviões   fc ", "acronym": "GVF"})
    without_accent = api.post("/clubs", json={"name": "Gavioes FC", "acronym": "GAV"})

    assert repeated.status_code == 409
    assert repeated.json()["message"]
    assert without_accent.status_code == 201


def test_b09_acronym_is_unique(api: httpx2.Client) -> None:
    response = api.post("/clubs", json={"name": "Grupo Fiel Clube", "acronym": "GFC"})

    assert response.status_code == 409


@pytest.mark.parametrize(
    "body",
    [
        {"name": "Gaviões FC"},
        {"name": "Gx", "acronym": "GXX"},
        {"name": "Clube 2000", "acronym": "CLU"},
        {"name": "Leões da Serra", "acronym": "lds"},
        {"name": "Leões da Serra", "acronym": "SDL"},
        {"name": "Leões da Serra", "acronym": "LLL"},
    ],
    ids=[
        "sem-sigla",
        "nome-curto",
        "nome-com-digito",
        "sigla-minuscula",
        "sigla-fora-de-ordem",
        "sigla-repetida",
    ],
)
def test_b09_name_and_acronym_formats(api: httpx2.Client, body: dict) -> None:
    assert api.post("/clubs", json=body).status_code == 400


def test_b09_clubs_come_in_name_order_with_the_id_breaking_ties(api: httpx2.Client) -> None:
    create_club(api, "Albatroz EC", "AEC")

    names = [item["name"] for item in api.get("/clubs").json()]

    assert names[:3] == ["Albatroz EC", "Gaviões FC", "Gavioes FC"]
