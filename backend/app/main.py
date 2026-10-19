from fastapi import FastAPI


def create_app() -> FastAPI:
    return FastAPI(
        title="Mercado de Jogadores",
        version="1.0.0",
        redirect_slashes=False,
    )


app = create_app()
