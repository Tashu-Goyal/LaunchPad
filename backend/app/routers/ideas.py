"""REST API endpoints for managing startup ideas and validation stages."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..models import ValidationStatus
from ..schemas import (
    IdeaCreate,
    IdeaDetailRead,
    IdeaImprovementUpdate,
    IdeaRead,
    IdeaStatusUpdate,
    IdeaUpdate,
)

router = APIRouter(prefix="/ideas", tags=["Ideas"])


@router.get("", response_model=list[IdeaRead])
def list_ideas(
    search: str | None = Query(
        default=None,
        description="Search across title, description, problem, solution, and audience.",
    ),
    status_filter: ValidationStatus | None = Query(
        default=None,
        alias="status",
        description="Filter ideas by validation status.",
    ),
    needs_improvement: bool | None = Query(
        default=None,
        description="Filter ideas flagged as needing improvement.",
    ),
    db: Session = Depends(get_db),
) -> list[IdeaRead]:
    """List startup ideas with optional search, status, and improvement filters."""
    return crud.list_ideas(
        db,
        search=search,
        status=status_filter,
        needs_improvement=needs_improvement,
    )


@router.post("", response_model=IdeaRead, status_code=status.HTTP_201_CREATED)
def create_idea(
    payload: IdeaCreate,
    db: Session = Depends(get_db),
) -> IdeaRead:
    """Create a new startup idea."""
    return crud.create_idea(db, payload)


@router.get("/{idea_id}", response_model=IdeaDetailRead)
def get_idea(
    idea_id: int,
    db: Session = Depends(get_db),
) -> IdeaDetailRead:
    """Retrieve a single startup idea along with its research notes."""
    idea = crud.get_idea_detail(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    return idea


@router.put("/{idea_id}", response_model=IdeaRead)
def update_idea(
    idea_id: int,
    payload: IdeaUpdate,
    db: Session = Depends(get_db),
) -> IdeaRead:
    """Update an existing startup idea's details."""
    idea = crud.get_idea_or_none(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    return crud.update_idea(db, idea, payload)


@router.patch("/{idea_id}/status", response_model=IdeaRead)
def update_idea_status(
    idea_id: int,
    payload: IdeaStatusUpdate,
    db: Session = Depends(get_db),
) -> IdeaRead:
    """Assign or update the validation status of a startup idea."""
    idea = crud.get_idea_or_none(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    return crud.update_idea_status(db, idea, payload)


@router.patch("/{idea_id}/improvement", response_model=IdeaRead)
def update_idea_improvement(
    idea_id: int,
    payload: IdeaImprovementUpdate,
    db: Session = Depends(get_db),
) -> IdeaRead:
    """Mark or unmark an idea as needing improvement with an optional reason."""
    idea = crud.get_idea_or_none(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    return crud.update_idea_improvement(db, idea, payload)


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(
    idea_id: int,
    db: Session = Depends(get_db),
) -> Response:
    """Delete a startup idea and all of its associated research notes."""
    idea = crud.get_idea_or_none(db, idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup idea with id {idea_id} was not found.",
        )
    crud.delete_idea(db, idea)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
