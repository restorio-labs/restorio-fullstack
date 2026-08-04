from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.authorization.actions import AuthorizationAction
from core.exceptions import BadRequestError
from core.models.enums import AccountType
from services.access_group_service import AccessGroupService


def test_rejects_non_delegable_capabilities() -> None:
    with pytest.raises(BadRequestError, match="cannot be delegated"):
        AccessGroupService._validate_capabilities(
            [AuthorizationAction.MENU_READ, AuthorizationAction.TENANT_DELETE]
        )


def test_normalizes_and_deduplicates_delegable_capabilities() -> None:
    capabilities = AccessGroupService._validate_capabilities(
        [AuthorizationAction.MENU_READ, AuthorizationAction.MENU_READ]
    )
    assert capabilities == ["menu.read"]


@pytest.mark.asyncio
async def test_assignment_requires_membership_in_the_same_tenant() -> None:
    service = AccessGroupService()
    service._get_group = AsyncMock(return_value=MagicMock())  # type: ignore[method-assign]
    session = AsyncMock()
    session.scalar.return_value = None

    with pytest.raises(BadRequestError, match="tenant employees"):
        await service.assign_member(
            session,
            tenant_id=uuid4(),
            group_id=uuid4(),
            account_id=uuid4(),
        )


@pytest.mark.asyncio
async def test_owner_membership_cannot_receive_an_access_group() -> None:
    service = AccessGroupService()
    service._get_group = AsyncMock(return_value=MagicMock())  # type: ignore[method-assign]
    session = AsyncMock()
    session.scalar.return_value = MagicMock(account_type=AccountType.OWNER)

    with pytest.raises(BadRequestError, match="tenant employees"):
        await service.assign_member(
            session,
            tenant_id=uuid4(),
            group_id=uuid4(),
            account_id=uuid4(),
        )


@pytest.mark.asyncio
async def test_assignment_is_bound_to_the_current_tenant_membership() -> None:
    service = AccessGroupService()
    service._get_group = AsyncMock(return_value=MagicMock())  # type: ignore[method-assign]
    session = AsyncMock()
    session.add = MagicMock()
    session.scalar.return_value = MagicMock(account_type=AccountType.WAITER)
    session.get.return_value = None
    tenant_id = uuid4()
    group_id = uuid4()
    account_id = uuid4()

    await service.assign_member(session, tenant_id, group_id, account_id)

    assignment = session.add.call_args.args[0]
    assert assignment.tenant_id == tenant_id
    assert assignment.group_id == group_id
    assert assignment.account_id == account_id
    session.flush.assert_awaited_once()
