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
        assert r.status_code == 401
        assert r.detail == "Unauthorized"

    def test_custom_message(self) -> None:
        r = UnauthenticatedResponse(message="Not logged in")
        assert r.status_code == 401
        assert r.detail == "Not logged in"


class TestUnauthorizedResponse:
    def test_default_message(self) -> None:
        r = UnauthorizedResponse()
        assert r.status_code == 403
        assert r.detail == "Unauthorized"


class TestNotFoundResponse:
    def test_default_message(self) -> None:
        r = NotFoundResponse()
        assert r.model_dump() == {}


class TestConflictResponse:
    def test_default_message(self) -> None:
        r = ConflictResponse()
        assert r.model_dump() == {}


class TestBadRequestResponse:
    def test_default_message(self) -> None:
        r = BadRequestResponse()
        assert r.model_dump() == {}


class TestGoneResponse:
    def test_default_message(self) -> None:
        r = GoneResponse()
        assert r.model_dump() == {}


class TestTooManyRequestsResponse:
    def test_default_message(self) -> None:
        r = TooManyRequestsResponse()
        assert r.model_dump() == {}


class TestServiceUnavailableResponse:
    def test_default_message(self) -> None:
        r = ServiceUnavailableResponse()
        assert r.model_dump() == {}
