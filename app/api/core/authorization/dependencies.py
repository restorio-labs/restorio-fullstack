from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.authorization.actions import AuthorizationAction
from core.authorization.engine import authorization_engine
from core.authorization.models import (
    AuthorizationEnvironment,
    AuthorizationRequest,
    AuthorizationResource,
    AuthorizationSubject,
    TenantAuthorization,
)
from core.exceptions.http import ForbiddenError, UnauthorizedError
from core.foundation.client_ip import get_client_ip
from core.foundation.database.database import get_db_session
from core.foundation.logging.audit import audit
from core.models.access_group import AccessGroup, AccessGroupAssignment
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole


def authenticated_account_id(request: Request) -> UUID:
    user = getattr(request.state, "user", None)
    subject = user.get("sub") if isinstance(user, dict) else None
    if not isinstance(subject, str):
        raise UnauthorizedError(message="Unauthorized")

    try:
        return UUID(subject)
    except ValueError:
        raise UnauthorizedError(message="Unauthorized") from None


async def authorize_account_action(
    *,
    action: AuthorizationAction,
    request: Request,
    session: AsyncSession,
) -> UUID:
    account_id = authenticated_account_id(request)
    roles = tuple(
        await session.scalars(
            select(TenantRole.account_type).where(TenantRole.account_id == account_id)
        )
    )
    authorization_request = AuthorizationRequest(
        subject=AuthorizationSubject(
            account_id=account_id,
            attributes={"membership_roles": roles},
        ),
        action=action,
        resource=AuthorizationResource(kind="tenant_collection"),
        environment=AuthorizationEnvironment(
            occurred_at=datetime.now(tz=UTC),
            method=request.method,
            path=request.url.path,
            client_ip=get_client_ip(request),
        ),
    )
    decision = authorization_engine.decide(authorization_request)
    audit.authorization_decision(
        request=request,
        user_id=str(account_id),
        tenant_id=None,
        action=action.value,
        allowed=decision.allowed,
        policy_id=decision.policy_id,
        reason=decision.reason,
    )
    if not decision.allowed:
        raise ForbiddenError(message="Insufficient permissions")
    return account_id


def require_account_action(action: AuthorizationAction):
    async def dependency(
        request: Request,
        session: AsyncSession = Depends(get_db_session),
    ) -> UUID:
        return await authorize_account_action(action=action, request=request, session=session)

    return dependency


async def authorize_tenant_action(
    *,
    action: AuthorizationAction,
    tenant_public_id: str,
    request: Request,
    session: AsyncSession,
) -> TenantAuthorization:
    account_id = authenticated_account_id(request)
    row = (
        await session.execute(
            select(Tenant, TenantRole)
            .outerjoin(
                TenantRole,
                (TenantRole.tenant_id == Tenant.id) & (TenantRole.account_id == account_id),
            )
            .where(Tenant.public_id == tenant_public_id)
        )
    ).one_or_none()

    if row is None:
        audit.authorization_decision(
            request=request,
            user_id=str(account_id),
            tenant_id=tenant_public_id,
            action=action.value,
            allowed=False,
            policy_id="tenant.lookup",
            reason="Tenant not found",
        )
        raise ForbiddenError(message="Access denied to this tenant")

    tenant, tenant_role = row
    raw_custom_capabilities = tuple(
        await session.scalars(
            select(AccessGroup.capabilities)
            .join(
                AccessGroupAssignment,
                AccessGroupAssignment.group_id == AccessGroup.id,
            )
            .where(
                AccessGroup.tenant_id == tenant.id,
                AccessGroupAssignment.tenant_id == tenant.id,
                AccessGroupAssignment.account_id == account_id,
            )
        )
    )
    custom_capabilities: set[AuthorizationAction] = set()
    for group_capabilities in raw_custom_capabilities:
        if not isinstance(group_capabilities, list):
            continue
        for raw_capability in group_capabilities:
            if not isinstance(raw_capability, str):
                continue
            try:
                custom_capabilities.add(AuthorizationAction(raw_capability))
            except ValueError:
                continue
    subject = AuthorizationSubject(
        account_id=account_id,
        tenant_role=tenant_role.account_type if tenant_role is not None else None,
        attributes={
            "tenant_id": tenant.id,
            "custom_capabilities": frozenset(custom_capabilities),
        },
    )
    resource = AuthorizationResource(
        kind=action.value.split(".", maxsplit=1)[0],
        tenant_id=tenant.id,
        resource_id=tenant_public_id,
        tenant_status=tenant.status,
    )
    environment = AuthorizationEnvironment(
        occurred_at=datetime.now(tz=UTC),
        method=request.method,
        path=request.url.path,
        client_ip=get_client_ip(request),
    )
    authorization_request = AuthorizationRequest(
        subject=subject,
        action=action,
        resource=resource,
        environment=environment,
    )
    decision = authorization_engine.decide(authorization_request)
    audit.authorization_decision(
        request=request,
        user_id=str(account_id),
        tenant_id=tenant_public_id,
        action=action.value,
        allowed=decision.allowed,
        policy_id=decision.policy_id,
        reason=decision.reason,
    )
    if not decision.allowed:
        raise ForbiddenError(message="Insufficient permissions")

    return TenantAuthorization(
        tenant_id=tenant.id,
        tenant_public_id=tenant.public_id,
        subject=subject,
        resource=resource,
        environment=environment,
        decision=decision,
    )


def require_tenant_action(action: AuthorizationAction):
    async def dependency(
        tenant_public_id: str,
        request: Request,
        session: AsyncSession = Depends(get_db_session),
    ) -> UUID:
        grant = await authorize_tenant_action(
            action=action,
            tenant_public_id=tenant_public_id,
            request=request,
            session=session,
        )
        return grant.tenant_id

    return dependency


def require_restaurant_action(action: AuthorizationAction):
    async def dependency(
        restaurant_id: str,
        request: Request,
        session: AsyncSession = Depends(get_db_session),
    ) -> UUID:
        grant = await authorize_tenant_action(
            action=action,
            tenant_public_id=restaurant_id,
            request=request,
            session=session,
        )
        return grant.tenant_id

    return dependency


TenantViewId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.TENANT_VIEW))]
TenantListAccountId = Annotated[
    UUID, Depends(require_account_action(AuthorizationAction.TENANT_LIST))
]
TenantCreateAccountId = Annotated[
    UUID, Depends(require_account_action(AuthorizationAction.TENANT_CREATE))
]
TenantUpdateId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.TENANT_UPDATE))]
TenantDeleteId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.TENANT_DELETE))]
ProfileViewTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PROFILE_VIEW))
]
ProfileUpdateTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PROFILE_UPDATE))
]
ProfileLogoReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PROFILE_LOGO_READ))
]
ProfileLogoWriteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PROFILE_LOGO_WRITE))
]
MobileConfigReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.MOBILE_CONFIG_READ))
]
MobileConfigWriteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.MOBILE_CONFIG_WRITE))
]
MenuReadTenantId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.MENU_READ))]
MenuWriteTenantId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.MENU_WRITE))]
MenuAvailabilityTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.MENU_AVAILABILITY_UPDATE))
]
MenuAssetWriteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.MENU_ASSET_WRITE))
]
FloorCanvasReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.FLOOR_CANVAS_READ))
]
FloorCanvasWriteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.FLOOR_CANVAS_WRITE))
]
FloorCanvasVersionReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.FLOOR_CANVAS_VERSION_READ))
]
OrderReadTenantId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_READ))]
OrderCreateTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_CREATE))
]
OrderUpdateTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_UPDATE))
]
OrderTransitionTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_TRANSITION))
]
OrderDeleteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_DELETE))
]
OrderArchiveTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_ARCHIVE))
]
OrderRefundTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ORDER_REFUND))
]
TableSessionReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.TABLE_SESSION_READ))
]
TableSessionUnlockTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.TABLE_SESSION_UNLOCK))
]
PaymentCreateTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PAYMENT_CREATE))
]
PaymentConfigReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PAYMENT_CONFIG_READ))
]
PaymentConfigWriteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PAYMENT_CONFIG_WRITE))
]
PaymentVerifyTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PAYMENT_VERIFY))
]
PaymentTransactionReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PAYMENT_TRANSACTION_READ))
]
PaymentReconcileTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.PAYMENT_RECONCILE))
]
StaffReadTenantId = Annotated[UUID, Depends(require_tenant_action(AuthorizationAction.STAFF_READ))]
StaffCreateTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.STAFF_CREATE))
]
StaffDeleteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.STAFF_DELETE))
]
AccessGroupReadTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ACCESS_GROUP_READ))
]
AccessGroupWriteTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ACCESS_GROUP_WRITE))
]
AccessGroupAssignTenantId = Annotated[
    UUID, Depends(require_tenant_action(AuthorizationAction.ACCESS_GROUP_ASSIGN))
]
KitchenConfigReadTenantId = Annotated[
    UUID, Depends(require_restaurant_action(AuthorizationAction.KITCHEN_CONFIG_READ))
]
KitchenConfigWriteTenantId = Annotated[
    UUID, Depends(require_restaurant_action(AuthorizationAction.KITCHEN_CONFIG_WRITE))
]
