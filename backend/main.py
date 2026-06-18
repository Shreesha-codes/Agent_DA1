"""
Conversational Data Analysis Agent — FastAPI Backend
Entry point for the API server.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.routes import users, data_sources, sessions, messages

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("data-agent")


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    settings = get_settings()

    # Ensure data cache directory exists
    os.makedirs(settings.DATA_CACHE_DIR, exist_ok=True)
    logger.info("Data cache directory ready: %s", settings.DATA_CACHE_DIR)

    logger.info("Backend started in %s mode", settings.ENVIRONMENT)
    yield
    logger.info("Backend shutting down")


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Data Analysis Agent API",
    description="Conversational data analysis powered by AI",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(data_sources.router, prefix="/api", tags=["Data Sources"])
app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(messages.router, prefix="/api", tags=["Messages"])


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
@app.get("/health/", tags=["Health"])
@app.head("/health", tags=["Health"])
@app.head("/health/", tags=["Health"])
async def health_check():
    """Health check endpoint — no auth required."""
    health = {"status": "ok", "sandbox": "subprocess", "database": "unknown"}

    # Check Supabase
    try:
        from db.client import get_supabase
        sb = get_supabase()
        # Simple query to verify connection
        sb.table("users").select("id").limit(1).execute()
        health["database"] = "connected"
    except Exception:
        health["database"] = "disconnected"

    return health
