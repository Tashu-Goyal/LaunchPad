"""SQLAlchemy ORM models for startup ideas and research notes."""

from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class ValidationStatus(str, Enum):
    """Allowed lifecycle stages for startup idea validation."""

    NOT_STARTED = "Not Started"
    RESEARCHING = "Researching"
    VALIDATING = "Validating"
    VALIDATED = "Validated"
    REJECTED = "Rejected"


def utc_now() -> datetime:
    """Return the current UTC timestamp."""
    return datetime.now(timezone.utc)


class Idea(Base):
    """Represents a startup idea tracked in LaunchPad."""

    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_solution: Mapped[str] = mapped_column(Text, nullable=False)
    target_audience: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=ValidationStatus.NOT_STARTED.value,
        index=True,
    )
    needs_improvement: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )
    improvement_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    notes: Mapped[list["ResearchNote"]] = relationship(
        "ResearchNote",
        back_populates="idea",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ResearchNote.created_at.desc()",
    )


class ResearchNote(Base):
    """Represents a market research entry and optional competitor reference for an idea."""

    __tablename__ = "research_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    idea_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ideas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    note_content: Mapped[str] = mapped_column(Text, nullable=False)
    competitor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    competitor_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    idea: Mapped["Idea"] = relationship("Idea", back_populates="notes")
