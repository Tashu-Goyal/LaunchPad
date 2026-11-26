"""Database configuration (SQLite locally, Supabase PostgreSQL in production)."""

import os
from collections.abc import Generator
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "launchpad.db"


def normalize_database_url(raw_url: str | None) -> str:
    """Normalize DATABASE_URL for SQLAlchemy + psycopg, defaulting to local SQLite."""
    if raw_url is None or not raw_url.strip():
        return f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

    cleaned = raw_url.strip()
    if cleaned.startswith("postgres://"):
        cleaned = f"postgresql+psycopg://{cleaned.removeprefix('postgres://')}"
    elif cleaned.startswith("postgresql://"):
        cleaned = f"postgresql+psycopg://{cleaned.removeprefix('postgresql://')}"

    if cleaned.startswith("postgresql+psycopg://"):
        parts = urlsplit(cleaned)
        host = (parts.hostname or "").lower()
        query_params = dict(parse_qsl(parts.query, keep_blank_values=True))
        if host not in {"localhost", "127.0.0.1"} and "sslmode" not in query_params:
            query_params["sslmode"] = "require"
            cleaned = urlunsplit(
                (
                    parts.scheme,
                    parts.netloc,
                    parts.path,
                    urlencode(query_params),
                    parts.fragment,
                )
            )

    return cleaned


def build_engine_kwargs(database_url: str, is_serverless: bool) -> dict[str, object]:
    """Build SQLAlchemy engine options for SQLite or Supabase pooled PostgreSQL."""
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}

    # Disable psycopg3 automatic prepared statements so Supabase's Supavisor
    # transaction pooler (port 6543) never hits DuplicatePreparedStatement errors.
    kwargs: dict[str, object] = {
        "connect_args": {"prepare_threshold": None},
    }
    if is_serverless:
        kwargs["poolclass"] = NullPool
    else:
        kwargs["pool_pre_ping"] = True
    return kwargs


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

engine = create_engine(
    DATABASE_URL,
    **build_engine_kwargs(DATABASE_URL, IS_SERVERLESS),
)


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
