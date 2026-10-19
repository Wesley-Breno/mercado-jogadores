from fastapi import APIRouter

from app.api.routers import (
    clubs,
    health,
    lineups,
    market,
    matches,
    players,
    standings,
    transactions,
)

API_PREFIX = "/api/v1"

api_router = APIRouter(prefix=API_PREFIX)
api_router.include_router(health.router)
api_router.include_router(players.router)
api_router.include_router(clubs.router)
api_router.include_router(market.router)
api_router.include_router(transactions.router)
api_router.include_router(lineups.router)
api_router.include_router(matches.router)
api_router.include_router(standings.router)
