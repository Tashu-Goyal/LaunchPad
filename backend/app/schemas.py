"""Pydantic schemas for request validation and API response serialization."""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, TypeAdapter, field_validator

from .models import ValidationStatus

_HTTP_URL_ADAPTER = TypeAdapter(HttpUrl)


def _validate_required_text(value: str, field_label: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError(f"{field_label} cannot be blank.")
    return cleaned


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _normalize_optional_url(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    validated = _HTTP_URL_ADAPTER.validate_python(cleaned)
    return str(validated)


class ResearchNoteBase(BaseModel):
    """Shared fields for creating or updating a research note."""

    note_content: Annotated[str, Field(min_length=1, max_length=5000)]
    competitor_name: Annotated[str | None, Field(default=None, max_length=150)] = None
    competitor_url: Annotated[str | None, Field(default=None, max_length=500)] = None

    @field_validator("note_content")
    @classmethod
    def validate_note_content(cls, value: str) -> str:
        return _validate_required_text(value, "Research note")

    @field_validator("competitor_name")
    @classmethod
    def clean_competitor_name(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("competitor_url")
    @classmethod
    def validate_competitor_url(cls, value: str | None) -> str | None:
        return _normalize_optional_url(value)


class ResearchNoteCreate(ResearchNoteBase):
    """Payload for creating a new research note."""


class ResearchNoteUpdate(BaseModel):
    """Payload for updating an existing research note."""

    note_content: Annotated[str | None, Field(default=None, min_length=1, max_length=5000)] = None
    competitor_name: Annotated[str | None, Field(default=None, max_length=150)] = None
    competitor_url: Annotated[str | None, Field(default=None, max_length=500)] = None

    @field_validator("note_content")
    @classmethod
    def validate_note_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _validate_required_text(value, "Research note")

    @field_validator("competitor_name")
    @classmethod
    def clean_competitor_name(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("competitor_url")
    @classmethod
    def validate_competitor_url(cls, value: str | None) -> str | None:
        return _normalize_optional_url(value)


class ResearchNoteRead(BaseModel):
    """Serialized research note returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    idea_id: int
    note_content: str
    competitor_name: str | None
    competitor_url: str | None
    created_at: datetime
    updated_at: datetime


class IdeaBase(BaseModel):
    """Shared fields for startup idea creation and replacement."""

    title: Annotated[str, Field(min_length=1, max_length=150)]
    description: Annotated[str, Field(min_length=1, max_length=3000)]
    problem_statement: Annotated[str, Field(min_length=1, max_length=3000)]
    proposed_solution: Annotated[str, Field(min_length=1, max_length=3000)]
    target_audience: Annotated[str, Field(min_length=1, max_length=255)]
    status: ValidationStatus = ValidationStatus.NOT_STARTED
    needs_improvement: bool = False
    improvement_note: Annotated[str | None, Field(default=None, max_length=1000)] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return _validate_required_text(value, "Title")

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        return _validate_required_text(value, "Description")

    @field_validator("problem_statement")
    @classmethod
    def validate_problem_statement(cls, value: str) -> str:
        return _validate_required_text(value, "Problem statement")

    @field_validator("proposed_solution")
    @classmethod
    def validate_proposed_solution(cls, value: str) -> str:
        return _validate_required_text(value, "Proposed solution")

    @field_validator("target_audience")
    @classmethod
    def validate_target_audience(cls, value: str) -> str:
        return _validate_required_text(value, "Target audience")

    @field_validator("improvement_note")
    @classmethod
    def clean_improvement_note(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class IdeaCreate(IdeaBase):
    """Payload for creating a new startup idea."""


class IdeaUpdate(BaseModel):
    """Payload for updating a startup idea (full or partial)."""

    title: Annotated[str | None, Field(default=None, min_length=1, max_length=150)] = None
    description: Annotated[str | None, Field(default=None, min_length=1, max_length=3000)] = None
    problem_statement: Annotated[str | None, Field(default=None, min_length=1, max_length=3000)] = None
    proposed_solution: Annotated[str | None, Field(default=None, min_length=1, max_length=3000)] = None
    target_audience: Annotated[str | None, Field(default=None, min_length=1, max_length=255)] = None
    status: ValidationStatus | None = None
    needs_improvement: bool | None = None
    improvement_note: Annotated[str | None, Field(default=None, max_length=1000)] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        return None if value is None else _validate_required_text(value, "Title")

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        return None if value is None else _validate_required_text(value, "Description")

    @field_validator("problem_statement")
    @classmethod
    def validate_problem_statement(cls, value: str | None) -> str | None:
        return None if value is None else _validate_required_text(value, "Problem statement")

    @field_validator("proposed_solution")
    @classmethod
    def validate_proposed_solution(cls, value: str | None) -> str | None:
        return None if value is None else _validate_required_text(value, "Proposed solution")

    @field_validator("target_audience")
    @classmethod
    def validate_target_audience(cls, value: str | None) -> str | None:
        return None if value is None else _validate_required_text(value, "Target audience")

    @field_validator("improvement_note")
    @classmethod
    def clean_improvement_note(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class IdeaStatusUpdate(BaseModel):
    """Payload for updating an idea's validation stage."""

    status: ValidationStatus


class IdeaImprovementUpdate(BaseModel):
    """Payload for toggling or updating the improvement indicator on an idea."""

    needs_improvement: bool
    improvement_note: Annotated[str | None, Field(default=None, max_length=1000)] = None

    @field_validator("improvement_note")
    @classmethod
    def clean_improvement_note(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class IdeaRead(BaseModel):
    """Serialized startup idea summary returned in lists and mutations."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    problem_statement: str
    proposed_solution: str
    target_audience: str
    status: ValidationStatus
    needs_improvement: bool
    improvement_note: str | None
    notes_count: int = 0
    created_at: datetime
    updated_at: datetime


class IdeaDetailRead(IdeaRead):
    """Serialized startup idea including all associated research notes."""

    notes: list[ResearchNoteRead] = []


class DashboardStats(BaseModel):
    """Dynamically calculated validation metrics for the dashboard."""

    total_ideas: int
    under_research: int
    validated: int
    needs_improvement: int
    status_breakdown: dict[str, int]
