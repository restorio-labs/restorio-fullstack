from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse[T](BaseModel):
    message: str | None = None
    data: T


class CreatedResponse[T](BaseModel):
    message: str = "Resource created successfully"
    data: T


class UpdatedResponse[T](BaseModel):
    message: str = "Resource updated successfully"
    data: T


class DeletedResponse(BaseModel):
    message: str = "Resource deleted successfully"


class ErrorResponse(BaseModel):
    message: str
    details: dict | None = None


class ValidationErrorResponse(BaseModel):
    message: str = "Validation failed"
    errors: list[dict[str, str]]


class PaginatedResponse[T](BaseModel):
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


class UnauthenticatedResponse(BaseModel):
    message: str = "Unauthenticated"


class UnauthorizedResponse(BaseModel):
    message: str = "Unauthorized"


class NotFoundResponse(BaseModel):
    message: str = "Not found"


class ConflictResponse(BaseModel):
    message: str = "Conflict"


class BadRequestResponse(BaseModel):
    message: str = "Bad request"


class GoneResponse(BaseModel):
    message: str = "Gone"


class TooManyRequestsResponse(BaseModel):
    message: str = "Too many requests"


class ServiceUnavailableResponse(BaseModel):
    message: str = "Service unavailable"
