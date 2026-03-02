from fastapi import HTTPException, status


class BaseHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message: str = "An error occurred",
        details: dict | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message)
        self.details = details


class NotFoundResponse(BaseHTTPException):
    def __init__(self, resource: str, identifier: str | None = None) -> None:
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(
            message=message,
        )


class ValidationError(BaseHTTPException):
    def __init__(
        self, message: str = "Validation failed", errors: list[dict[str, str]] | None = None
    ) -> None:
        super().__init__(
            message=message,
            details={"errors": errors} if errors else None,
        )


class UnauthorizedError(BaseHTTPException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(
            message=message,
        )


class ForbiddenError(BaseHTTPException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(
            message=message,
        )


class ConflictError(BaseHTTPException):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(
            message=message,
        )


class BadRequestError(BaseHTTPException):
    def __init__(self, message: str = "Bad request") -> None:
        super().__init__(
            message=message,
        )


class GoneError(BaseHTTPException):
    def __init__(self, message: str = "Resource no longer available") -> None:
        super().__init__(
            message=message,
        )


class TooManyRequestsError(BaseHTTPException):
    def __init__(self, message: str = "Too many requests") -> None:
        super().__init__(
            message=message,
        )


class ServiceUnavailableError(BaseHTTPException):
    def __init__(self, message: str = "Service unavailable") -> None:
        super().__init__(
            message=message,
        )


class ExternalAPIError(BaseHTTPException):
    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
        )
