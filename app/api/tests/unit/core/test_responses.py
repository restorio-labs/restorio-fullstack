from core.foundation.http.responses import (
    BadRequestResponse,
    ConflictResponse,
    GoneResponse,
    NotFoundResponse,
    ServiceUnavailableResponse,
    TooManyRequestsResponse,
    UnauthenticatedResponse,
    UnauthorizedResponse,
)


class TestUnauthenticatedResponse:
    def test_default_message(self) -> None:
        r = UnauthenticatedResponse()
        assert r.message == "Unauthenticated"

    def test_custom_message(self) -> None:
        r = UnauthenticatedResponse(message="Not logged in")
        assert r.message == "Not logged in"


class TestUnauthorizedResponse:
    def test_default_message(self) -> None:
        r = UnauthorizedResponse()
        assert r.message == "Unauthorized"


class TestNotFoundResponse:
    def test_default_message(self) -> None:
        r = NotFoundResponse()
        assert r.message == "Not found"


class TestConflictResponse:
    def test_default_message(self) -> None:
        r = ConflictResponse()
        assert r.message == "Conflict"


class TestBadRequestResponse:
    def test_default_message(self) -> None:
        r = BadRequestResponse()
        assert r.message == "Bad request"


class TestGoneResponse:
    def test_default_message(self) -> None:
        r = GoneResponse()
        assert r.message == "Gone"


class TestTooManyRequestsResponse:
    def test_default_message(self) -> None:
        r = TooManyRequestsResponse()
        assert r.message == "Too many requests"


class TestServiceUnavailableResponse:
    def test_default_message(self) -> None:
        r = ServiceUnavailableResponse()
        assert r.message == "Service unavailable"
