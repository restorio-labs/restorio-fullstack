from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

from core.foundation.http.responses import ErrorResponse


class BaseHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message: str = "An error occurred",
        error_code: str | None = None,
        details: dict | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message)
        self.error_code = error_code or "INTERNAL_ERROR"
        self.details = details

    def to_response(self) -> JSONResponse:
        error_response = ErrorResponse(
            error_code=self.error_code,
            message=self.detail,
            details=self.details,
        )
        return JSONResponse(
            status_code=self.status_code,
            content=error_response.model_dump(exclude_none=True),
        )


class NotFoundError(BaseHTTPException):
    def __init__(self, resource: str, identifier: str | None = None) -> None:
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code="NOT_FOUND",
        )


class ValidationError(BaseHTTPException):
    def __init__(
        self, message: str = "Validation failed", errors: list[dict[str, str]] | None = None
    ) -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error_code="VALIDATION_ERROR",
            details={"errors": errors} if errors else None,
        )


class UnauthorizedError(BaseHTTPException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code="UNAUTHORIZED",
        )


class ForbiddenError(BaseHTTPException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code="FORBIDDEN",
        )


class ConflictError(BaseHTTPException):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            error_code="CONFLICT",
        )


class BadRequestError(BaseHTTPException):
    def __init__(self, message: str = "Bad request") -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="BAD_REQUEST",
        )


class GoneError(BaseHTTPException):
    def __init__(self, message: str = "Resource no longer available") -> None:
        super().__init__(
            status_code=status.HTTP_410_GONE,
            message=message,
            error_code="GONE",
        )


class TooManyRequestsError(BaseHTTPException):
    def __init__(self, message: str = "Too many requests") -> None:
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=message,
            error_code="TOO_MANY_REQUESTS",
        )


class ServiceUnavailableError(BaseHTTPException):
    def __init__(self, message: str = "Service unavailable") -> None:
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=message,
            error_code="SERVICE_UNAVAILABLE",
        )


class ExternalAPIError(BaseHTTPException):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(
            status_code=status_code,
            message=message,
            error_code="EXTERNAL_API_ERROR",
        )
