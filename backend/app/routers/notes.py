"""REST API endpoints for managing idea research notes and competitors."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import ResearchNoteCreate, ResearchNoteRead, ResearchNoteUpdate

router = APIRouter(tags=["Research Notes"])


@router.get("/ideas/{idea_id}/notes", response_model=list[ResearchNoteRead])
def list_notes_for_idea(
    idea_id: int,
    db: Session = Depends(get_db),
) -> list[ResearchNoteRead]:
    """List all research notes attached to a specific startup idea."""
    idea = crud.get_idea_or_none(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    notes = crud.list_notes_for_idea(db, idea_id)
    return [ResearchNoteRead.model_validate(note) for note in notes]


@router.post(
    "/ideas/{idea_id}/notes",
    response_model=ResearchNoteRead,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    idea_id: int,
    payload: ResearchNoteCreate,
    db: Session = Depends(get_db),
) -> ResearchNoteRead:
    """Create a research note with optional competitor metadata for an idea."""
    idea = crud.get_idea_or_none(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    note = crud.create_note(db, idea, payload)
    return ResearchNoteRead.model_validate(note)


@router.put("/notes/{note_id}", response_model=ResearchNoteRead)
def update_note(
    note_id: int,
    payload: ResearchNoteUpdate,
    db: Session = Depends(get_db),
) -> ResearchNoteRead:
    """Update an existing research note."""
    note = crud.get_note_or_none(db, note_id)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research note with id {note_id} was not found.",
        )
    updated = crud.update_note(db, note, payload)
    return ResearchNoteRead.model_validate(updated)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
) -> Response:
    """Delete a research note."""
    note = crud.get_note_or_none(db, note_id)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research note with id {note_id} was not found.",
        )
    crud.delete_note(db, note)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
