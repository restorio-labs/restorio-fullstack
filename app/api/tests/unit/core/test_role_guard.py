from uuid import uuid4

from fastapi import Request
import pytest

from core.authorization.dependencies import authenticated_account_id
from core.exceptions.http import UnauthorizedError


def _request_with_user(user: object) -> Request:
    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    request.state.user = user
    return request


def test_authenticated_account_id_uses_identity_claim_only() -> None:
    account_id = uuid4()
    request = _request_with_user(
        {
            "sub": str(account_id),
            "account_type": "owner",
            "tenant_ids": ["untrusted-legacy-claim"],
        }
    )
    assert authenticated_account_id(request) == account_id


@pytest.mark.parametrize("user", [None, "invalid", {}, {"sub": "not-a-uuid"}])
def test_authenticated_account_id_rejects_invalid_identity(user: object) -> None:
    with pytest.raises(UnauthorizedError):
        authenticated_account_id(_request_with_user(user))
