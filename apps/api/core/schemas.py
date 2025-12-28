from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    message: str | None = None
    data: T


class CreatedResponse(BaseModel, Generic[T]):
    message: str = "Resource created successfully"
    data: T


class UpdatedResponse(BaseModel, Generic[T]):
    message: str = "Resource updated successfully"
    data: T


class DeletedResponse(BaseModel):
    message: str = "Resource deleted successfully"


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: dict | None = None


class ValidationErrorResponse(BaseModel):
    error_code: str = "VALIDATION_ERROR"
    message: str = "Validation failed"
    errors: list[dict[str, str]]


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
