from fastapi import APIRouter

router = APIRouter(tags=["Saúde"])


@router.get("/health", summary="Confirma que a API está no ar")
def read_health() -> dict[str, str]:
    return {"status": "ok"}
