"""Database configuration (SQLite locally, PostgreSQL in production) and session management."""

import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "launchpad.db"


def normalize_database_url(raw_url: str | None) -> str:
    """Normalize DATABASE_URL for SQLAlchemy, defaulting to local SQLite."""
    if raw_url is None or not raw_url.strip():
        return f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

    cleaned = raw_url.strip()
    if cleaned.startswith("postgres://"):
        return f"postgresql+psycopg://{cleaned.removeprefix('postgres://')}"
    if cleaned.startswith("postgresql://"):
        return f"postgresql+psycopg://{cleaned.removeprefix('postgresql://')}"
    return cleaned


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

engine_kwargs: dict[str, object] = {}
if IS_SQLITE:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif IS_SERVERLESS:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    """Ensure SQLite enforces foreign key constraints (required for ON DELETE CASCADE)."""
    if IS_SQLITE:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session per FastAPI request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
