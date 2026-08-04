from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette.requests import Request

from core.authorization.actions import AuthorizationAction
from core.dto.v1 import CreateTenantDTO, UpdateTenantDTO
from core.models.enums import TenantStatus
from routes.v1.tenants import tenants as tenants_routes


@pytest.mark.asyncio
async def test_list_tenants_success() -> None:
    t = SimpleNamespace(
        public_id="p1",
        name="A",
        slug="a",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.list_tenants = AsyncMock(return_value=[t])
    r = await tenants_routes.list_tenants(uuid4(), MagicMock(), svc)  # type: ignore[arg-type]
    assert len(r.data) == 1


@pytest.mark.asyncio
async def test_create_tenant() -> None:
    out = SimpleNamespace(
        public_id="pub",
        name="B",
        slug="b",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.create_tenant = AsyncMock(return_value=out)
    body = CreateTenantDTO(name="B", slug="b", status=TenantStatus.ACTIVE)
    r = await tenants_routes.create_tenant(uuid4(), body, MagicMock(), svc)
    assert "created" in r.message
    assert r.data.id == "pub"


@pytest.mark.asyncio
async def test_get_tenant_capabilities_returns_policy_projection() -> None:
    grant = SimpleNamespace(subject=object(), resource=object(), environment=object())
    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})

    with (
        patch(
            "routes.v1.tenants.tenants.authorize_tenant_action",
            new=AsyncMock(return_value=grant),
        ) as authorize,
        patch.object(
            tenants_routes.authorization_engine,
            "capabilities",
            return_value={AuthorizationAction.MENU_READ, AuthorizationAction.MENU_WRITE},
        ),
    ):
        response = await tenants_routes.get_tenant_capabilities(
            "tenant-public-id", request, MagicMock()
        )

    authorize.assert_awaited_once()
    assert response.data.tenant_id == "tenant-public-id"
    assert response.data.capabilities == ["menu.read", "menu.write"]


@pytest.mark.asyncio
async def test_get_tenant() -> None:
    tid = uuid4()
    t = SimpleNamespace(
        public_id="pub",
        name="A",
        slug="a",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.get_tenant = AsyncMock(return_value=t)
    r = await tenants_routes.get_tenant(tid, MagicMock(), svc)  # type: ignore[arg-type]
    assert r.data.slug == "a"


@pytest.mark.asyncio
async def test_update_tenant() -> None:
    tid = uuid4()
    t = SimpleNamespace(
        public_id="pub",
        name="N",
        slug="n",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.update_tenant = AsyncMock(return_value=t)
    r = await tenants_routes.update_tenant(  # type: ignore[call-arg]
        tid,
        UpdateTenantDTO(name="N", slug="n", status=TenantStatus.ACTIVE),
        MagicMock(),
        svc,
    )
    assert "updated" in r.message


@pytest.mark.asyncio
async def test_delete_tenant() -> None:
    tid = uuid4()
    svc = MagicMock()
    svc.delete_tenant = AsyncMock()
    r = await tenants_routes.delete_tenant(tid, MagicMock(), svc)  # type: ignore[arg-type]
    assert "deleted" in r.message
