from typing import Generic, TypeVar

from fastapi import status
from fastapi.responses import JSONResponse

from core.schemas import (
    CreatedResponse,
    DeletedResponse,
    ErrorResponse,
    PaginatedResponse,
    SuccessResponse,
    UpdatedResponse,
)

T = TypeVar("T")


def success_response(
    data: T,
    message: str | None = None,
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    response = SuccessResponse[T](message=message, data=data)
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(exclude_none=True),
    )


def created_response(
    data: T,
    message: str = "Resource created successfully",
) -> JSONResponse:
    response = CreatedResponse[T](message=message, data=data)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=response.model_dump(),
    )


def updated_response(
    data: T,
    message: str = "Resource updated successfully",
) -> JSONResponse:
    response = UpdatedResponse[T](message=message, data=data)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=response.model_dump(),
    )


def deleted_response(
    message: str = "Resource deleted successfully",
) -> JSONResponse:
    response = DeletedResponse(message=message)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=response.model_dump(),
    )


def paginated_response(
    paginated_data: PaginatedResponse[T],
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=paginated_data.model_dump(),
    )


def error_response(
    error_code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: dict | None = None,
) -> JSONResponse:
    response = ErrorResponse(
        error_code=error_code,
        message=message,
        details=details,
    )
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(exclude_none=True),
    )


