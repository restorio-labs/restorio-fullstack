from datetime import UTC, datetime
from uuid import uuid4

import pytest

from core.authorization.actions import AuthorizationAction
from core.authorization.engine import AuthorizationEngine
from core.authorization.models import (
    AuthorizationEnvironment,
    AuthorizationRequest,
    AuthorizationResource,
    AuthorizationSubject,
)
from core.models.enums import AccountType, TenantStatus


def _request(
    *,
    role: AccountType | None,
    action: AuthorizationAction,
    subject_tenant_id=None,
    resource_tenant_id=None,
    status: TenantStatus = TenantStatus.ACTIVE,
) -> AuthorizationRequest:
    subject_tenant_id = subject_tenant_id or uuid4()
    resource_tenant_id = resource_tenant_id or subject_tenant_id
    return AuthorizationRequest(
        subject=AuthorizationSubject(
            account_id=uuid4(),
            tenant_role=role,
            attributes={"tenant_id": subject_tenant_id},
        ),
        action=action,
        resource=AuthorizationResource(
            kind="test",
            tenant_id=resource_tenant_id,
            tenant_status=status,
        ),
        environment=AuthorizationEnvironment(
            occurred_at=datetime.now(tz=UTC),
            method="GET",
            path="/test",
        ),
    )


@pytest.mark.parametrize("role", list(AccountType))
def test_members_can_read_orders_in_their_tenant(role: AccountType) -> None:
    decision = AuthorizationEngine().decide(
        _request(role=role, action=AuthorizationAction.ORDER_READ)
    )
    assert decision.allowed is True


def test_cross_tenant_resource_is_denied_even_for_owner() -> None:
    decision = AuthorizationEngine().decide(
        _request(
            role=AccountType.OWNER,
            action=AuthorizationAction.TENANT_DELETE,
            subject_tenant_id=uuid4(),
            resource_tenant_id=uuid4(),
        )
    )
    assert decision.allowed is False
    assert decision.policy_id == "tenant.boundary"


def test_manager_cannot_manage_payment_credentials() -> None:
    decision = AuthorizationEngine().decide(
        _request(role=AccountType.MANAGER, action=AuthorizationAction.PAYMENT_CONFIG_WRITE)
    )
    assert decision.allowed is False
    assert decision.policy_id == "capability.required"


def test_missing_membership_is_denied() -> None:
    decision = AuthorizationEngine().decide(
        _request(role=None, action=AuthorizationAction.TENANT_VIEW)
    )
    assert decision.allowed is False
    assert decision.policy_id == "membership.required"


def test_suspended_tenant_denies_operational_actions() -> None:
    decision = AuthorizationEngine().decide(
        _request(
            role=AccountType.OWNER,
            action=AuthorizationAction.ORDER_READ,
            status=TenantStatus.SUSPENDED,
        )
    )
    assert decision.allowed is False
    assert decision.policy_id == "tenant.active"


def test_owner_can_restore_a_suspended_tenant() -> None:
    decision = AuthorizationEngine().decide(
        _request(
            role=AccountType.OWNER,
            action=AuthorizationAction.TENANT_UPDATE,
            status=TenantStatus.SUSPENDED,
        )
    )
    assert decision.allowed is True


def test_capability_projection_uses_full_policy() -> None:
    request = _request(
        role=AccountType.MANAGER,
        action=AuthorizationAction.TENANT_VIEW,
    )
    capabilities = AuthorizationEngine().capabilities(
        subject=request.subject,
        resource=request.resource,
        environment=request.environment,
    )
    assert AuthorizationAction.MENU_WRITE in capabilities
    assert AuthorizationAction.PAYMENT_CONFIG_WRITE not in capabilities
    assert AuthorizationAction.TENANT_CREATE not in capabilities


def test_application_access_is_tenant_attribute_driven() -> None:
    waiter_request = _request(
        role=AccountType.WAITER,
        action=AuthorizationAction.APP_WAITER_ACCESS,
    )
    engine = AuthorizationEngine()
    assert engine.decide(waiter_request).allowed is True
    kitchen_decision = engine.decide(
        AuthorizationRequest(
            subject=waiter_request.subject,
            action=AuthorizationAction.APP_KITCHEN_ACCESS,
            resource=waiter_request.resource,
            environment=waiter_request.environment,
        )
    )
    assert kitchen_decision.allowed is False


@pytest.mark.parametrize(
    ("role", "action"),
    [
        (AccountType.KITCHEN, AuthorizationAction.FLOOR_CANVAS_WRITE),
        (AccountType.KITCHEN, AuthorizationAction.PAYMENT_RECONCILE),
        (AccountType.WAITER, AuthorizationAction.MENU_AVAILABILITY_UPDATE),
        (AccountType.WAITER, AuthorizationAction.STAFF_READ),
    ],
)
def test_staff_baseline_uses_least_privilege(
    role: AccountType,
    action: AuthorizationAction,
) -> None:
    decision = AuthorizationEngine().decide(_request(role=role, action=action))
    assert decision.allowed is False
    assert decision.policy_id == "capability.required"


def test_assigned_group_can_add_a_delegable_capability() -> None:
    request = _request(
        role=AccountType.WAITER,
        action=AuthorizationAction.MENU_AVAILABILITY_UPDATE,
    )
    subject = AuthorizationSubject(
        account_id=request.subject.account_id,
        tenant_role=request.subject.tenant_role,
        attributes={
            **request.subject.attributes,
            "custom_capabilities": frozenset({AuthorizationAction.MENU_AVAILABILITY_UPDATE}),
        },
    )
    decision = AuthorizationEngine().decide(
        AuthorizationRequest(
            subject=subject,
            action=request.action,
            resource=request.resource,
            environment=request.environment,
        )
    )
    assert decision.allowed is True
    assert decision.policy_id == "tenant.access_group"


def test_assigned_group_cannot_add_a_non_delegable_capability() -> None:
    request = _request(
        role=AccountType.WAITER,
        action=AuthorizationAction.TENANT_DELETE,
    )
    subject = AuthorizationSubject(
        account_id=request.subject.account_id,
        tenant_role=request.subject.tenant_role,
        attributes={
            **request.subject.attributes,
            "custom_capabilities": frozenset({AuthorizationAction.TENANT_DELETE}),
        },
    )
    decision = AuthorizationEngine().decide(
        AuthorizationRequest(
            subject=subject,
            action=request.action,
            resource=request.resource,
            environment=request.environment,
        )
    )
    assert decision.allowed is False
    assert decision.policy_id == "capability.required"
