from fastapi import status

from core.exceptions import (
    BadRequestError,
    BaseHTTPException,
    ConflictError,
    ForbiddenError,
    GoneError,
    NotFoundError,
    TooManyRequestsError,
    UnauthorizedError,
    ValidationError,
)


class TestBaseHTTPException:
    def test_base_exception_default_values(self) -> None:
        exception = BaseHTTPException()

        assert exception.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exception.detail == "An error occurred"
        assert exception.error_code == "INTERNAL_ERROR"
        assert exception.details is None

    def test_base_exception_custom_values(self) -> None:
        details = {"key": "value"}
        exception = BaseHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Custom error",
            error_code="CUSTOM_ERROR",
            details=details,
        )

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Custom error"
        assert exception.error_code == "CUSTOM_ERROR"
        assert exception.details == details

    def test_base_exception_to_response(self) -> None:
        exception = BaseHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Test error",
            error_code="TEST_ERROR",
        )
        response = exception.to_response()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = response.body.decode()
        assert "TEST_ERROR" in content
        assert "Test error" in content


class TestNotFoundError:
    def test_not_found_error_without_identifier(self) -> None:
        exception = NotFoundError("User")

        assert exception.status_code == status.HTTP_404_NOT_FOUND
        assert exception.detail == "User not found"
        assert exception.error_code == "NOT_FOUND"

    def test_not_found_error_with_identifier(self) -> None:
        exception = NotFoundError("User", identifier="123")

        assert exception.status_code == status.HTTP_404_NOT_FOUND
        assert exception.detail == "User with id '123' not found"
        assert exception.error_code == "NOT_FOUND"


class TestValidationError:
    def test_validation_error_default_message(self) -> None:
        exception = ValidationError()

        assert exception.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert exception.detail == "Validation failed"
        assert exception.error_code == "VALIDATION_ERROR"

    def test_validation_error_with_errors(self) -> None:
        errors = [{"field": "email", "message": "Invalid format"}]
        exception = ValidationError(message="Custom validation error", errors=errors)

        assert exception.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert exception.detail == "Custom validation error"
        assert exception.details is not None
        assert "errors" in exception.details


class TestUnauthorizedError:
    def test_unauthorized_error_default_message(self) -> None:
        exception = UnauthorizedError()

        assert exception.status_code == status.HTTP_401_UNAUTHORIZED
        assert exception.detail == "Unauthorized"
        assert exception.error_code == "UNAUTHORIZED"

    def test_unauthorized_error_custom_message(self) -> None:
        exception = UnauthorizedError("Invalid credentials")

        assert exception.status_code == status.HTTP_401_UNAUTHORIZED
        assert exception.detail == "Invalid credentials"
        assert exception.error_code == "UNAUTHORIZED"


class TestForbiddenError:
    def test_forbidden_error_default_message(self) -> None:
        exception = ForbiddenError()

        assert exception.status_code == status.HTTP_403_FORBIDDEN
        assert exception.detail == "Forbidden"
        assert exception.error_code == "FORBIDDEN"

    def test_forbidden_error_custom_message(self) -> None:
        exception = ForbiddenError("Access denied")

        assert exception.status_code == status.HTTP_403_FORBIDDEN
        assert exception.detail == "Access denied"
        assert exception.error_code == "FORBIDDEN"


class TestConflictError:
    def test_conflict_error_default_message(self) -> None:
        exception = ConflictError()

        assert exception.status_code == status.HTTP_409_CONFLICT
        assert exception.detail == "Resource conflict"
        assert exception.error_code == "CONFLICT"

    def test_conflict_error_custom_message(self) -> None:
        exception = ConflictError("Email already exists")

        assert exception.status_code == status.HTTP_409_CONFLICT
        assert exception.detail == "Email already exists"
        assert exception.error_code == "CONFLICT"


class TestBadRequestError:
    def test_bad_request_error_default_message(self) -> None:
        exception = BadRequestError()

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Bad request"
        assert exception.error_code == "BAD_REQUEST"

    def test_bad_request_error_custom_message(self) -> None:
        exception = BadRequestError("Invalid input")

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Invalid input"
        assert exception.error_code == "BAD_REQUEST"


class TestGoneError:
    def test_gone_error_default_message(self) -> None:
        exception = GoneError()

        assert exception.status_code == status.HTTP_410_GONE
        assert exception.detail == "Resource no longer available"
        assert exception.error_code == "GONE"

    def test_gone_error_custom_message(self) -> None:
        exception = GoneError("Activation link has expired")

        assert exception.status_code == status.HTTP_410_GONE
        assert exception.detail == "Activation link has expired"
        assert exception.error_code == "GONE"


class TestTooManyRequestsError:
    def test_too_many_requests_error_default_message(self) -> None:
        exception = TooManyRequestsError()

        assert exception.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert exception.detail == "Too many requests"
        assert exception.error_code == "TOO_MANY_REQUESTS"

    def test_too_many_requests_error_custom_message(self) -> None:
        exception = TooManyRequestsError("Please wait before requesting another email.")

        assert exception.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert exception.detail == "Please wait before requesting another email."
        assert exception.error_code == "TOO_MANY_REQUESTS"
