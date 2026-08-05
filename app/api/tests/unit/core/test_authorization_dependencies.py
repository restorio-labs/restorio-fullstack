from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import Request
import pytest

from core.authorization.actions import AuthorizationAction
from core.authorization.dependencies import authorize_tenant_action
from core.exceptions.http import ForbiddenError
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole


def _request(account_id, **legacy_claims: object) -> Request:
    request = Request(
        {
            "type": "http",
            "method": "PUT",
            "path": "/tenants/tenant-b/p24-config",
            "headers": [],
            "client": ("127.0.0.1", 1234),
        }
    )
    request.state.user = {"sub": str(account_id), **legacy_claims}
    return request


def _session_row(tenant: Tenant, role: TenantRole) -> AsyncMock:
    result = MagicMock()
    result.one_or_none.return_value = (tenant, role)
    session = AsyncMock()
    session.execute.return_value = result
    return session


@pytest.mark.asyncio
async def test_tenant_role_is_loaded_for_requested_tenant_not_from_jwt() -> None:
    account_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        public_id="tenant-b",
        name="Tenant B",
        slug="tenant-b",
        status=TenantStatus.ACTIVE,
    )
    waiter_membership = TenantRole(
        account_id=account_id,
        tenant_id=tenant.id,
        account_type=AccountType.WAITER,
    )
    session = _session_row(tenant, waiter_membership)
    request = _request(
        account_id,
        account_type="owner",
        tenant_ids=["tenant-a", "tenant-b"],
    )

    with (
        patch("core.authorization.dependencies.audit"),
        pytest.raises(ForbiddenError, match="Insufficient permissions"),
    ):
        await authorize_tenant_action(
            action=AuthorizationAction.PAYMENT_CONFIG_WRITE,
            tenant_public_id="tenant-b",
            request=request,
            session=session,
        )


@pytest.mark.asyncio
async def test_database_owner_attribute_grants_owner_action() -> None:
    account_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        public_id="tenant-a",
        name="Tenant A",
        slug="tenant-a",
        status=TenantStatus.ACTIVE,
    )
    owner_membership = TenantRole(
        account_id=account_id,
        tenant_id=tenant.id,
        account_type=AccountType.OWNER,
    )
    session = _session_row(tenant, owner_membership)

    with patch("core.authorization.dependencies.audit"):
        grant = await authorize_tenant_action(
            action=AuthorizationAction.PAYMENT_CONFIG_WRITE,
            tenant_public_id="tenant-a",
            request=_request(account_id, account_type="waiter"),
            session=session,
        )

    assert grant.tenant_id == tenant.id
    assert grant.subject.tenant_role is AccountType.OWNER


@pytest.mark.asyncio
async def test_assigned_access_group_grants_delegable_action() -> None:
    account_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        public_id="tenant-a",
        name="Tenant A",
        slug="tenant-a",
        status=TenantStatus.ACTIVE,
    )
    waiter_membership = TenantRole(
        account_id=account_id,
        tenant_id=tenant.id,
        account_type=AccountType.WAITER,
    )
    session = _session_row(tenant, waiter_membership)
    session.scalars.return_value = [[AuthorizationAction.MENU_AVAILABILITY_UPDATE.value]]

    with patch("core.authorization.dependencies.audit"):
        grant = await authorize_tenant_action(
            action=AuthorizationAction.MENU_AVAILABILITY_UPDATE,
            tenant_public_id="tenant-a",
            request=_request(account_id),
            session=session,
        )

    assert grant.decision.allowed is True
    assert grant.decision.policy_id == "tenant.access_group"
    assert grant.subject.attributes["custom_capabilities"] == frozenset(
        {AuthorizationAction.MENU_AVAILABILITY_UPDATE}
    )


@pytest.mark.asyncio
async def test_malformed_group_capabilities_are_ignored() -> None:
    account_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        public_id="tenant-a",
        name="Tenant A",
        slug="tenant-a",
        status=TenantStatus.ACTIVE,
    )
    waiter_membership = TenantRole(
        account_id=account_id,
        tenant_id=tenant.id,
        account_type=AccountType.WAITER,
    )
    session = _session_row(tenant, waiter_membership)
    session.scalars.return_value = [None, "menu.write", [None, "unknown.action"]]

    with (
        patch("core.authorization.dependencies.audit"),
        pytest.raises(ForbiddenError, match="Insufficient permissions"),
    ):
        await authorize_tenant_action(
            action=AuthorizationAction.MENU_WRITE,
            tenant_public_id="tenant-a",
            request=_request(account_id),
            session=session,
        )
