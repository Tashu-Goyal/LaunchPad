"""LaunchPad FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import dashboard, ideas, notes


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Verify the API service is running."""
    return {"status": "ok"}


app.include_router(dashboard.router, prefix="/api")
app.include_router(ideas.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
