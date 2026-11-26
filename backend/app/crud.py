"""Database query and persistence helpers for LaunchPad."""

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from .models import Idea, ResearchNote, ValidationStatus, utc_now
from .schemas import (
    DashboardStats,
    IdeaCreate,
    IdeaDetailRead,
    IdeaImprovementUpdate,
    IdeaRead,
    IdeaStatusUpdate,
    IdeaUpdate,
    ResearchNoteCreate,
    ResearchNoteRead,
    ResearchNoteUpdate,
)


def _to_idea_read(idea: Idea, notes_count: int) -> IdeaRead:
    """Convert an ORM Idea and note count into an IdeaRead schema."""
    return IdeaRead(
        id=idea.id,
        title=idea.title,
        description=idea.description,
        problem_statement=idea.problem_statement,
        proposed_solution=idea.proposed_solution,
        target_audience=idea.target_audience,
        status=ValidationStatus(idea.status),
        needs_improvement=idea.needs_improvement,
        improvement_note=idea.improvement_note,
        notes_count=notes_count,
        created_at=idea.created_at,
        updated_at=idea.updated_at,
    )


def _to_idea_detail_read(idea: Idea) -> IdeaDetailRead:
    """Convert an ORM Idea with eager-loaded notes into an IdeaDetailRead schema."""
    notes = [ResearchNoteRead.model_validate(note) for note in idea.notes]
    return IdeaDetailRead(
        id=idea.id,
        title=idea.title,
        description=idea.description,
        problem_statement=idea.problem_statement,
        proposed_solution=idea.proposed_solution,
        target_audience=idea.target_audience,
        status=ValidationStatus(idea.status),
        needs_improvement=idea.needs_improvement,
        improvement_note=idea.improvement_note,
        notes_count=len(notes),
        created_at=idea.created_at,
        updated_at=idea.updated_at,
        notes=notes,
    )


def get_dashboard_stats(db: Session) -> DashboardStats:
    """Compute real-time validation KPIs directly from SQLite records."""
    breakdown: dict[str, int] = {status.value: 0 for status in ValidationStatus}

    status_rows = db.execute(
        select(Idea.status, func.count(Idea.id)).group_by(Idea.status)
    ).all()
    for status_value, count in status_rows:
        if status_value in breakdown:
            breakdown[status_value] = int(count)

    total_ideas = sum(breakdown.values())
    under_research = (
        breakdown[ValidationStatus.RESEARCHING.value]
        + breakdown[ValidationStatus.VALIDATING.value]
    )
    validated = breakdown[ValidationStatus.VALIDATED.value]
    needs_improvement = (
        db.scalar(
            select(func.count(Idea.id)).where(Idea.needs_improvement.is_(True))
        )
        or 0
    )

    return DashboardStats(
        total_ideas=total_ideas,
        under_research=under_research,
        validated=validated,
        needs_improvement=int(needs_improvement),
        status_breakdown=breakdown,
    )


def list_ideas(
    db: Session,
    search: str | None = None,
    status: ValidationStatus | None = None,
    needs_improvement: bool | None = None,
) -> list[IdeaRead]:
    """Return startup ideas matching optional search text, status, and improvement filter."""
    notes_count_sq = (
        select(
            ResearchNote.idea_id,
            func.count(ResearchNote.id).label("notes_count"),
        )
        .group_by(ResearchNote.idea_id)
        .subquery()
    )

    stmt = (
        select(Idea, func.coalesce(notes_count_sq.c.notes_count, 0).label("notes_count"))
        .outerjoin(notes_count_sq, Idea.id == notes_count_sq.c.idea_id)
    )

    if search is not None:
        term = search.strip()
        if term:
            pattern = f"%{term}%"
            stmt = stmt.where(
                or_(
                    Idea.title.ilike(pattern),
                    Idea.description.ilike(pattern),
                    Idea.problem_statement.ilike(pattern),
                    Idea.proposed_solution.ilike(pattern),
                    Idea.target_audience.ilike(pattern),
                )
            )

    if status is not None:
        stmt = stmt.where(Idea.status == status.value)

    if needs_improvement is not None:
        stmt = stmt.where(Idea.needs_improvement.is_(needs_improvement))

    stmt = stmt.order_by(Idea.updated_at.desc(), Idea.id.desc())
    rows = db.execute(stmt).all()
    return [_to_idea_read(idea, int(notes_count)) for idea, notes_count in rows]


def get_idea_or_none(
    db: Session, idea_id: int, *, load_notes: bool = False
) -> Idea | None:
    """Fetch a single Idea ORM record by ID."""
    stmt = select(Idea).where(Idea.id == idea_id)
    if load_notes:
        stmt = stmt.options(selectinload(Idea.notes))
    return db.scalar(stmt)


def get_idea_detail(db: Session, idea_id: int) -> IdeaDetailRead | None:
    """Return a single idea with its ordered research notes, or None."""
    idea = get_idea_or_none(db, idea_id, load_notes=True)
    if idea is None:
        return None
    return _to_idea_detail_read(idea)


def create_idea(db: Session, payload: IdeaCreate) -> IdeaRead:
    """Persist a new startup idea in SQLite."""
    idea = Idea(
        title=payload.title,
        description=payload.description,
        problem_statement=payload.problem_statement,
        proposed_solution=payload.proposed_solution,
        target_audience=payload.target_audience,
        status=payload.status.value,
        needs_improvement=payload.needs_improvement,
        improvement_note=payload.improvement_note if payload.needs_improvement else None,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return _to_idea_read(idea, notes_count=0)


def _count_notes_for_idea(db: Session, idea_id: int) -> int:
    count = db.scalar(
        select(func.count(ResearchNote.id)).where(ResearchNote.idea_id == idea_id)
    )
    return int(count or 0)


def update_idea(db: Session, idea: Idea, payload: IdeaUpdate) -> IdeaRead:
    """Apply partial or full updates to an existing startup idea."""
    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value

    for field, value in updates.items():
        setattr(idea, field, value)

    if updates.get("needs_improvement") is False and "improvement_note" not in updates:
        idea.improvement_note = None

    idea.updated_at = utc_now()
    db.commit()
    db.refresh(idea)
    return _to_idea_read(idea, notes_count=_count_notes_for_idea(db, idea.id))


def update_idea_status(
    db: Session, idea: Idea, payload: IdeaStatusUpdate
) -> IdeaRead:
    """Update only the validation stage of an idea."""
    idea.status = payload.status.value
    idea.updated_at = utc_now()
    db.commit()
    db.refresh(idea)
    return _to_idea_read(idea, notes_count=_count_notes_for_idea(db, idea.id))


def update_idea_improvement(
    db: Session, idea: Idea, payload: IdeaImprovementUpdate
) -> IdeaRead:
    """Flag or unflag an idea as needing improvement."""
    idea.needs_improvement = payload.needs_improvement
    idea.improvement_note = (
        payload.improvement_note if payload.needs_improvement else None
    )
    idea.updated_at = utc_now()
    db.commit()
    db.refresh(idea)
    return _to_idea_read(idea, notes_count=_count_notes_for_idea(db, idea.id))


def delete_idea(db: Session, idea: Idea) -> None:
    """Delete a startup idea and cascade-remove its research notes."""
    db.delete(idea)
    db.commit()


def list_notes_for_idea(db: Session, idea_id: int) -> list[ResearchNote]:
    """Return all research notes associated with a given idea, newest first."""
    stmt = (
        select(ResearchNote)
        .where(ResearchNote.idea_id == idea_id)
        .order_by(ResearchNote.created_at.desc(), ResearchNote.id.desc())
    )
    return list(db.scalars(stmt).all())


def create_note(
    db: Session, idea: Idea, payload: ResearchNoteCreate
) -> ResearchNote:
    """Attach a new research note to an existing idea."""
    note = ResearchNote(
        idea_id=idea.id,
        note_content=payload.note_content,
        competitor_name=payload.competitor_name,
        competitor_url=payload.competitor_url,
    )
    idea.updated_at = utc_now()
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_note_or_none(db: Session, note_id: int) -> ResearchNote | None:
    """Fetch a single research note by ID."""
    return db.scalar(select(ResearchNote).where(ResearchNote.id == note_id))


def update_note(
    db: Session, note: ResearchNote, payload: ResearchNoteUpdate
) -> ResearchNote:
    """Update an existing research note."""
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(note, field, value)

    note.updated_at = utc_now()
    parent_idea = get_idea_or_none(db, note.idea_id)
    if parent_idea is not None:
        parent_idea.updated_at = utc_now()

    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note: ResearchNote) -> None:
    """Delete a research note."""
    parent_idea = get_idea_or_none(db, note.idea_id)
    if parent_idea is not None:
        parent_idea.updated_at = utc_now()
    db.delete(note)
    db.commit()
