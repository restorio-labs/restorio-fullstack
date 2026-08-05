from datetime import datetime
from uuid import UUID

from pydantic import Field, field_validator

from core.authorization.actions import AuthorizationAction
from core.dto.v1.common import BaseDTO


class AccessGroupUpsertDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    capabilities: list[AuthorizationAction] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class AccessGroupResponseDTO(BaseDTO):
    id: UUID
    name: str
    description: str | None
    capabilities: list[str]
    member_ids: list[UUID]
    created_at: datetime
    updated_at: datetime


class AccessGroupOptionsDTO(BaseDTO):
    capabilities: list[str]
