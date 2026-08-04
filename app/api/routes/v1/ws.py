from datetime import UTC, datetime
import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from core.authorization.actions import AuthorizationAction
from core.authorization.engine import authorization_engine
from core.authorization.models import (
    AuthorizationEnvironment,
    AuthorizationRequest,
    AuthorizationResource,
    AuthorizationSubject,
)
from core.foundation.database.database import AsyncSessionLocal
from core.foundation.security import security_service
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()


async def _authenticate_websocket(websocket: WebSocket) -> dict | None:
    """Extract and validate access token from websocket connection.

    Checks query param 'token' first, then falls back to cookie.
    Returns decoded token payload or None if authentication fails.
    """
    token: str | None = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("rat")

    if not token:
        return None

    try:
        return security_service.decode_access_token(token)
    except Exception:
        return None


async def _authorize_tenant_access(user: dict, tenant_public_id: str) -> bool:
    """Evaluate tenant-scoped kitchen access from current database attributes."""
    subject = user.get("sub")
    if not isinstance(subject, str):
        return False

    try:
        account_id = UUID(subject)
    except ValueError:
        return False

    async with AsyncSessionLocal() as session:
        row = (
            await session.execute(
            select(Tenant, TenantRole)
            .join(TenantRole, TenantRole.tenant_id == Tenant.id)
            .where(
                Tenant.public_id == tenant_public_id,
                TenantRole.account_id == account_id,
            )
            )
        ).one_or_none()
        if row is None:
            return False
        tenant, role = row
        decision = authorization_engine.decide(
            AuthorizationRequest(
                subject=AuthorizationSubject(
                    account_id=account_id,
                    tenant_role=role.account_type,
                    attributes={"tenant_id": tenant.id},
                ),
                action=AuthorizationAction.KITCHEN_CONFIG_READ,
                resource=AuthorizationResource(
                    kind="kitchen_config",
                    tenant_id=tenant.id,
                    resource_id=tenant_public_id,
                    tenant_status=tenant.status,
                ),
                environment=AuthorizationEnvironment(
                    occurred_at=datetime.now(tz=UTC),
                    method="WEBSOCKET",
                    path=f"/ws/kitchen/{tenant_public_id}",
                ),
            )
        )
        return decision.allowed


@router.websocket("/ws/kitchen/{restaurant_id}")
async def kitchen_websocket(websocket: WebSocket, restaurant_id: str) -> None:
    user = await _authenticate_websocket(websocket)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    has_access = await _authorize_tenant_access(user, restaurant_id)
    if not has_access:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(restaurant_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(restaurant_id, websocket)
    except Exception:
        ws_manager.disconnect(restaurant_id, websocket)
