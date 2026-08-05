from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.dto.v1 import CreateTenantDTO
from core.models.enums import TenantStatus
from routes.v1.tenants.tenants import create_tenant


@pytest.mark.asyncio
async def test_create_tenant_uses_authorized_account_id() -> None:
    user_id = uuid4()
    tenant = SimpleNamespace(
        public_id="tenant-public-id",
        name="My Place",
        slug="my-place",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    service = MagicMock()
    service.create_tenant = AsyncMock(return_value=tenant)
    body = CreateTenantDTO(name="My Place", slug="my-place", status=TenantStatus.ACTIVE)

    response = await create_tenant(user_id, body, MagicMock(), service)

    service.create_tenant.assert_awaited_once()
    assert service.create_tenant.await_args.args[2] == user_id
    assert response.data.id == "tenant-public-id"
