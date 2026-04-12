from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.dto.v1.tenants import CreateTenantDTO
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from services.tenant_service import TenantService


def _make_fake_session(tenants: list[Tenant]) -> object:
    async def fake_execute(_self: object, query: object) -> object:
        class FakeScalars:
            def all(self) -> list[object]:
                return []

        class FakeResult:
            def scalars(self) -> FakeScalars:
                return FakeScalars()

        return FakeResult()

    class FakeSession:
        execute = fake_execute

    return FakeSession()


@pytest.mark.asyncio
async def test_list_tenants_accepts_user_id_and_returns_list() -> None:
    service = TenantService()
    user_id = uuid4()

    session = _make_fake_session([])
    tenants = await service.list_tenants(session, user_id)

    assert tenants == []


@pytest.mark.asyncio
async def test_list_tenants_returns_tenants_from_execute_result() -> None:
    service = TenantService()
    user_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        name="Test Tenant",
        slug="test-tenant",
        status=TenantStatus.ACTIVE,
    )

    async def fake_execute(_self: object, query: object) -> object:
        class FakeScalars:
            def all(self) -> list[Tenant]:
                return [tenant]

        class FakeResult:
            def scalars(self) -> FakeScalars:
                return FakeScalars()

        return FakeResult()

    class FakeSession:
        execute = fake_execute

    session = FakeSession()
    tenants = await service.list_tenants(session, user_id)

    assert len(tenants) == 1
    assert tenants[0].id == tenant.id
    assert tenants[0].name == tenant.name


@pytest.mark.asyncio
async def test_create_tenant_creates_owner_role_and_commits() -> None:
    service = TenantService()
    owner_id = uuid4()
    dto = CreateTenantDTO(name="New Tenant", slug="new-tenant")
    added_objects: list[object] = []

    def add_side_effect(value: object) -> None:
        added_objects.append(value)

    async def flush_side_effect() -> None:
        for item in added_objects:
            if isinstance(item, Tenant) and item.id is None:
                item.id = uuid4()
            if isinstance(item, Tenant) and item.public_id == "":
                item.public_id = "public-id"
            if isinstance(item, Tenant) and item.created_at is None:
                item.created_at = datetime.now(UTC)
            if isinstance(item, Tenant) and item.floor_canvases is None:
                item.floor_canvases = []

    session = SimpleNamespace(
        add=MagicMock(side_effect=add_side_effect),
        flush=AsyncMock(side_effect=flush_side_effect),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    tenant = await service.create_tenant(session, dto, owner_id)

    tenant_role = next((item for item in added_objects if isinstance(item, TenantRole)), None)

    assert tenant.name == "New Tenant"
    assert tenant.slug == "new-tenant"
    assert tenant.owner_id == owner_id
    assert tenant.status == TenantStatus.ACTIVE
    assert isinstance(tenant_role, TenantRole)
    assert tenant_role.account_id == owner_id
    assert tenant_role.tenant_id == tenant.id
    assert tenant_role.account_type == AccountType.OWNER
    session.flush.assert_awaited_once()
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once_with(tenant, attribute_names=["floor_canvases"])


@pytest.mark.asyncio
async def test_create_tenant_normalizes_slug_diacritics() -> None:
    service = TenantService()
    owner_id = uuid4()
    dto = CreateTenantDTO(name="New Tenant", slug="zażółć-gęślą-jaźń")
    added_objects: list[object] = []

    def add_side_effect(value: object) -> None:
        added_objects.append(value)

    async def flush_side_effect() -> None:
        for item in added_objects:
            if isinstance(item, Tenant) and item.id is None:
                item.id = uuid4()
            if isinstance(item, Tenant) and item.public_id == "":
                item.public_id = "public-id"
            if isinstance(item, Tenant) and item.created_at is None:
                item.created_at = datetime.now(UTC)
            if isinstance(item, Tenant) and item.floor_canvases is None:
                item.floor_canvases = []

    session = SimpleNamespace(
        add=MagicMock(side_effect=add_side_effect),
        flush=AsyncMock(side_effect=flush_side_effect),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    tenant = await service.create_tenant(session, dto, owner_id)

    assert tenant.slug == "zazolc-gesla-jazn"
