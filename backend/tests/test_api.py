"""Integration tests for the LaunchPad REST API against a real SQLite database."""

from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    """Create an isolated SQLite database and FastAPI TestClient per test."""
    test_db_path = tmp_path / "test_launchpad.db"
    test_engine = create_engine(
        f"sqlite:///{test_db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(Engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )
    Base.metadata.create_all(bind=test_engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    test_engine.dispose()


def _sample_idea_payload(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "title": "AI Invoice Chaser",
        "description": "Automated polite follow-ups for overdue freelance invoices.",
        "problem_statement": "Freelancers lose hours chasing late client payments.",
        "proposed_solution": "Connect accounting tools and automate multi-channel reminders.",
        "target_audience": "Independent designers and boutique agencies",
        "status": "Not Started",
        "needs_improvement": False,
        "improvement_note": None,
    }
    data.update(overrides)
    return data


def test_health_check(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_idea_crud_and_dashboard_stats(client: TestClient) -> None:
    # Initial dashboard should be empty
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    assert stats_res.json() == {
        "total_ideas": 0,
        "under_research": 0,
        "validated": 0,
        "needs_improvement": 0,
        "status_breakdown": {
            "Not Started": 0,
            "Researching": 0,
            "Validating": 0,
            "Validated": 0,
            "Rejected": 0,
        },
    }

    # Create three ideas across different states
    r1 = client.post("/api/ideas", json=_sample_idea_payload(title="Idea A", status="Researching"))
    r2 = client.post(
        "/api/ideas",
        json=_sample_idea_payload(
            title="Idea B",
            status="Validated",
            needs_improvement=True,
            improvement_note="Clarify enterprise pricing tier",
        ),
    )
    r3 = client.post("/api/ideas", json=_sample_idea_payload(title="Idea C", status="Rejected"))
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r3.status_code == 201

    idea_a = r1.json()
    idea_b = r2.json()
    idea_c = r3.json()

    # Dashboard: Rejected alone does NOT count as needs_improvement unless flagged
    stats = client.get("/api/dashboard/stats").json()
    assert stats["total_ideas"] == 3
    assert stats["under_research"] == 1
    assert stats["validated"] == 1
    assert stats["needs_improvement"] == 1
    assert stats["status_breakdown"]["Rejected"] == 1

    # Update status of Idea A -> Validating (still under_research)
    patch_status = client.patch(
        f"/api/ideas/{idea_a['id']}/status",
        json={"status": "Validating"},
    )
    assert patch_status.status_code == 200
    assert patch_status.json()["status"] == "Validating"

    # Flag Idea C for improvement independently of its Rejected status
    patch_imp = client.patch(
        f"/api/ideas/{idea_c['id']}/improvement",
        json={"needs_improvement": True, "improvement_note": "Pivot to B2B compliance"},
    )
    assert patch_imp.status_code == 200
    assert patch_imp.json()["needs_improvement"] is True

    updated_stats = client.get("/api/dashboard/stats").json()
    assert updated_stats["under_research"] == 1
    assert updated_stats["needs_improvement"] == 2

    # Full update via PUT
    put_res = client.put(
        f"/api/ideas/{idea_b['id']}",
        json={"title": "Idea B v2", "needs_improvement": False},
    )
    assert put_res.status_code == 200
    assert put_res.json()["title"] == "Idea B v2"
    assert put_res.json()["needs_improvement"] is False
    assert put_res.json()["improvement_note"] is None

    # Delete Idea A
    del_res = client.delete(f"/api/ideas/{idea_a['id']}")
    assert del_res.status_code == 204
    assert client.get(f"/api/ideas/{idea_a['id']}").status_code == 404


def test_search_and_filters(client: TestClient) -> None:
    client.post(
        "/api/ideas",
        json=_sample_idea_payload(
            title="Solar Microgrid Planner",
            target_audience="Rural clinics",
            status="Researching",
            needs_improvement=True,
            improvement_note="Need hardware cost estimates",
        ),
    )
    client.post(
        "/api/ideas",
        json=_sample_idea_payload(
            title="Meal Prep Copilot",
            target_audience="Busy parents",
            status="Validated",
            needs_improvement=False,
        ),
    )

    by_search = client.get("/api/ideas", params={"search": "clinics"}).json()
    assert len(by_search) == 1
    assert by_search[0]["title"] == "Solar Microgrid Planner"

    by_status = client.get("/api/ideas", params={"status": "Validated"}).json()
    assert len(by_status) == 1
    assert by_status[0]["title"] == "Meal Prep Copilot"

    by_improvement = client.get("/api/ideas", params={"needs_improvement": "true"}).json()
    assert len(by_improvement) == 1
    assert by_improvement[0]["title"] == "Solar Microgrid Planner"

    no_match = client.get(
        "/api/ideas",
        params={"search": "Solar", "status": "Validated"},
    ).json()
    assert no_match == []


def test_research_notes_crud_and_cascade_delete(client: TestClient) -> None:
    idea = client.post("/api/ideas", json=_sample_idea_payload()).json()
    idea_id = idea["id"]

    # Create note with competitor info
    create_note = client.post(
        f"/api/ideas/{idea_id}/notes",
        json={
            "note_content": "Interviewed 8 freelancers; 6 want automated Stripe links.",
            "competitor_name": "FreshBooks",
            "competitor_url": "https://www.freshbooks.com",
        },
    )
    assert create_note.status_code == 201
    note = create_note.json()
    assert note["competitor_name"] == "FreshBooks"
    assert note["competitor_url"] == "https://www.freshbooks.com/"

    # Detail view includes notes and notes_count == 1
    detail = client.get(f"/api/ideas/{idea_id}").json()
    assert detail["notes_count"] == 1
    assert len(detail["notes"]) == 1

    # Update note
    upd = client.put(
        f"/api/notes/{note['id']}",
        json={"note_content": "Updated interview synthesis across 12 users."},
    )
    assert upd.status_code == 200
    assert upd.json()["note_content"] == "Updated interview synthesis across 12 users."

    # Delete parent idea cascades notes
    assert client.delete(f"/api/ideas/{idea_id}").status_code == 204
    assert client.put(f"/api/notes/{note['id']}", json={"note_content": "x"}).status_code == 404


def test_validation_and_error_handling(client: TestClient) -> None:
    # Blank title rejected
    blank_res = client.post("/api/ideas", json=_sample_idea_payload(title="   "))
    assert blank_res.status_code == 422

    # Invalid status rejected
    bad_status = client.post("/api/ideas", json=_sample_idea_payload(status="In Progress"))
    assert bad_status.status_code == 422

    # Invalid competitor URL rejected
    idea = client.post("/api/ideas", json=_sample_idea_payload()).json()
    bad_url = client.post(
        f"/api/ideas/{idea['id']}/notes",
        json={
            "note_content": "Checked competitor landing page",
            "competitor_name": "BadCo",
            "competitor_url": "not-a-valid-url",
        },
    )
    assert bad_url.status_code == 422

    # Non-existent idea returns 404
    assert client.get("/api/ideas/99999").status_code == 404
    assert client.post("/api/ideas/99999/notes", json={"note_content": "Hello"}).status_code == 404


def test_production_config_helpers() -> None:
    from sqlalchemy.pool import NullPool

    from app.database import build_engine_kwargs, normalize_database_url
    from app.main import parse_allowed_origins

    # Default / blank DATABASE_URL falls back to local SQLite
    sqlite_url = normalize_database_url(None)
    assert sqlite_url.startswith("sqlite:///")
    assert normalize_database_url("   ").startswith("sqlite:///")

    # Supabase transaction/session pooler URLs normalize to psycopg v3 + sslmode=require
    assert (
        normalize_database_url(
            "postgres://postgres.projref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
        )
        == "postgresql+psycopg://postgres.projref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    )
    assert (
        normalize_database_url(
            "postgresql://postgres.projref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
        )
        == "postgresql+psycopg://postgres.projref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    )
    assert (
        normalize_database_url("postgresql://postgres:secret@localhost:5432/launchpad")
        == "postgresql+psycopg://postgres:secret@localhost:5432/launchpad"
    )

    # Engine kwargs adapt cleanly for SQLite, local Postgres, and Vercel serverless Supabase
    assert build_engine_kwargs(sqlite_url, is_serverless=False) == {
        "connect_args": {"check_same_thread": False}
    }
    pg_url = "postgresql+psycopg://postgres.projref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    assert build_engine_kwargs(pg_url, is_serverless=True) == {
        "connect_args": {"prepare_threshold": None},
        "poolclass": NullPool,
    }
    assert build_engine_kwargs(pg_url, is_serverless=False) == {
        "connect_args": {"prepare_threshold": None},
        "pool_pre_ping": True,
    }

    # CORS origins preserve local defaults and strip trailing slashes on production URLs
    origins = parse_allowed_origins("https://launchpad-ui.vercel.app/, https://custom.example.com")
    assert "http://localhost:5173" in origins
    assert "https://launchpad-ui.vercel.app" in origins
    assert "https://custom.example.com" in origins


def test_vercel_entrypoint_exports_fastapi_app() -> None:
    import importlib.util

    entrypoint = Path(__file__).resolve().parents[2] / "api" / "index.py"
    spec = importlib.util.spec_from_file_location("vercel_api_index", entrypoint)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    assert hasattr(module, "app")
    with TestClient(module.app) as vercel_client:
        health = vercel_client.get("/api/health")
        assert health.status_code == 200
        assert health.json() == {"status": "ok"}
