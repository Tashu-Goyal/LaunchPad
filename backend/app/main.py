"""LaunchPad FastAPI application entry point."""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import dashboard, ideas, notes

DEFAULT_LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def parse_allowed_origins(raw_origins: str | None) -> list[str]:
    """Combine default local origins with comma-separated production origins."""
    origins = list(DEFAULT_LOCAL_ORIGINS)
    if not raw_origins:
        return origins

    for item in raw_origins.split(","):
        cleaned = item.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)
    return origins


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Create database tables on startup if they do not exist."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="LaunchPad – Startup Idea Validation Platform API",
    description="REST API for managing startup ideas, validation stages, and competitor research notes.",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = parse_allowed_origins(os.getenv("ALLOWED_ORIGINS"))
allowed_origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX") or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root_info() -> dict[str, str]:
    """Provide basic API service metadata at the root path."""
    return {
        "service": "LaunchPad – Startup Idea Validation Platform API",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Verify the API service is running."""
    return {"status": "ok"}


app.include_router(dashboard.router, prefix="/api")
app.include_router(ideas.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
