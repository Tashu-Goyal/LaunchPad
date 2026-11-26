"""Dashboard metrics endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def read_dashboard_stats(db: Session = Depends(get_db)) -> DashboardStats:
    """Return dynamically calculated counts for ideas and validation stages."""
    return crud.get_dashboard_stats(db)
