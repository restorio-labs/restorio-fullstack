from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from fastapi import HTTPException
import pytest

from core.dto.v1.tenants import CreateTenantDTO
from core.models.enums import TenantStatus
from routes.v1.tenants.tenants import create_tenant


def _make_request(user: object) -> SimpleNamespace:
    return SimpleNamespace(state=SimpleNamespace(user=user))


def _make_tenant(public_id: str = "tenant-public-id") -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        public_id=public_id,
        name="Created Tenant",
        slug="created-tenant",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_create_tenant_raises_401_when_user_is_not_dict() -> None:
    request = _make_request(user=None)
    service = AsyncMock()
    body = CreateTenantDTO(name="Test", slug="test")

    with pytest.raises(HTTPException) as exc_info:
        await create_tenant(MagicMock(), request, body, AsyncMock(), service)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Unauthorized"
    service.create_tenant.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_tenant_raises_401_when_subject_is_invalid() -> None:
    request = _make_request(user={"sub": 123})
    service = AsyncMock()
    body = CreateTenantDTO(name="Test", slug="test")

    with pytest.raises(HTTPException) as exc_info:
        await create_tenant(MagicMock(), request, body, AsyncMock(), service)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Unauthorized"
    service.create_tenant.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_tenant_calls_service_with_user_id_and_returns_created_response() -> None:
    user_id = uuid4()
    request = _make_request(user={"sub": str(user_id)})
    service = AsyncMock()
    body = CreateTenantDTO(name="My Place", slug="my-place", status=TenantStatus.ACTIVE)
    created_tenant = _make_tenant()
    service.create_tenant.return_value = created_tenant

    response = await create_tenant(MagicMock(), request, body, AsyncMock(), service)

    service.create_tenant.assert_awaited_once()
    call_args = service.create_tenant.await_args.args
    assert call_args[2] == user_id
    assert call_args[1].name == "My Place"
    assert call_args[1].slug == "my-place"
    assert call_args[1].status == TenantStatus.ACTIVE
    assert response.message == "Tenant created successfully"
    assert response.data.id == created_tenant.public_id
    assert response.data.name == created_tenant.name
