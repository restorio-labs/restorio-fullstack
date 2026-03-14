from fastapi import Request
import pytest

from core.exceptions.http import ForbiddenError, UnauthorizedError
from core.foundation.role_guard import _extract_account_type, require_roles
from core.models.enums import AccountType


def _request_with_user(user):
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    request = Request(scope)
    request.state.user = user
    return request


def test_extract_account_type_raises_unauthorized_without_user_dict() -> None:
    request = _request_with_user("not-a-dict")
    with pytest.raises(UnauthorizedError, match="Unauthorized"):
        _extract_account_type(request)


def test_extract_account_type_raises_for_missing_or_empty_role() -> None:
    with pytest.raises(ForbiddenError, match="No role assigned"):
        _extract_account_type(_request_with_user({}))

    with pytest.raises(ForbiddenError, match="No role assigned"):
        _extract_account_type(_request_with_user({"account_type": ""}))


def test_extract_account_type_raises_for_unknown_role() -> None:
    request = _request_with_user({"account_type": "alien"})
    with pytest.raises(ForbiddenError, match="Unknown role"):
        _extract_account_type(request)


def test_extract_account_type_returns_enum_for_valid_role() -> None:
    request = _request_with_user({"account_type": "owner"})
    assert _extract_account_type(request) is AccountType.OWNER


@pytest.mark.asyncio
async def test_require_roles_allows_and_rejects() -> None:
    guard = require_roles(AccountType.OWNER, AccountType.MANAGER)

    allowed_request = _request_with_user({"account_type": "manager"})
    assert await guard(allowed_request) is AccountType.MANAGER

    denied_request = _request_with_user({"account_type": "waiter"})
    with pytest.raises(ForbiddenError, match="Insufficient permissions"):
        await guard(denied_request)
