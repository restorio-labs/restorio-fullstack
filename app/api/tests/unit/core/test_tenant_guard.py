from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from core.authorization.actions import AuthorizationAction
from core.foundation.tenant_guard import resolve_and_authorize_tenant


@pytest.mark.asyncio
async def test_legacy_tenant_guard_delegates_to_abac() -> None:
    tenant_id = uuid4()
    grant = SimpleNamespace(tenant_id=tenant_id)
    request = MagicMock()
    session = AsyncMock()

    with patch(
        "core.foundation.tenant_guard.authorize_tenant_action",
        new=AsyncMock(return_value=grant),
    ) as authorize:
        result = await resolve_and_authorize_tenant("tenant-public-id", request, session)

    assert result == tenant_id
    authorize.assert_awaited_once_with(
        action=AuthorizationAction.TENANT_VIEW,
        tenant_public_id="tenant-public-id",
        request=request,
        session=session,
    )


@pytest.mark.asyncio
async def test_legacy_tenant_claims_are_not_inspected() -> None:
    request = MagicMock()
    request.state.user = {
        "sub": str(uuid4()),
        "tenant_ids": ["attacker-controlled-tenant"],
        "account_type": "owner",
    }
    session = AsyncMock()
    error = PermissionError("denied by ABAC")

    with patch(
        "core.foundation.tenant_guard.authorize_tenant_action",
        new=AsyncMock(side_effect=error),
    ), pytest.raises(PermissionError, match="denied by ABAC"):
        await resolve_and_authorize_tenant("attacker-controlled-tenant", request, session)
