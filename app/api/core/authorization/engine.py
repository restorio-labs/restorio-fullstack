from __future__ import annotations

from core.authorization.actions import AuthorizationAction
from core.authorization.models import (
    AuthorizationDecision,
    AuthorizationEnvironment,
    AuthorizationRequest,
    AuthorizationResource,
    AuthorizationSubject,
)
from core.authorization.policies import DELEGABLE_ACTIONS, TENANT_ACTIONS, capabilities_for_role
from core.models.enums import AccountType, TenantStatus


class AuthorizationEngine:
    """Deterministic, deny-by-default ABAC policy evaluator."""

    policy_version = "2026-08-tenant-abac-v1"

    def decide(self, request: AuthorizationRequest) -> AuthorizationDecision:  # noqa: PLR0911
        subject = request.subject
        resource = request.resource

        if request.action == AuthorizationAction.TENANT_LIST:
            return AuthorizationDecision(
                True, "account.authenticated", "Authenticated account may list tenants"
            )

        if request.action == AuthorizationAction.TENANT_CREATE:
            membership_roles = subject.attributes.get("membership_roles", ())
            if not membership_roles or AccountType.OWNER in membership_roles:
                return AuthorizationDecision(
                    True,
                    "tenant.create.owner_or_unassigned",
                    "Account may create a tenant",
                )
            return AuthorizationDecision(
                False,
                "tenant.create.owner_or_unassigned",
                "Only an owner or unassigned account may create a tenant",
            )

        if resource.tenant_id is None:
            return AuthorizationDecision(
                False, "resource.tenant.required", "Tenant resource required"
            )

        subject_tenant_id = subject.attributes.get("tenant_id")
        if subject_tenant_id != resource.tenant_id:
            return AuthorizationDecision(
                False, "tenant.boundary", "Subject and resource tenants differ"
            )

        if subject.tenant_role is None:
            return AuthorizationDecision(False, "membership.required", "Tenant membership required")

        base_grant = request.action in capabilities_for_role(subject.tenant_role)
        custom_capabilities = subject.attributes.get("custom_capabilities", frozenset())
        custom_grant = request.action in DELEGABLE_ACTIONS and request.action in custom_capabilities
        if not base_grant and not custom_grant:
            return AuthorizationDecision(
                False,
                "capability.required",
                f"Tenant attributes do not grant {request.action.value}",
            )

        lifecycle_actions = {
            AuthorizationAction.TENANT_VIEW,
            AuthorizationAction.TENANT_UPDATE,
            AuthorizationAction.TENANT_DELETE,
        }
        if (
            resource.tenant_status != TenantStatus.ACTIVE
            and request.action not in lifecycle_actions
        ):
            return AuthorizationDecision(False, "tenant.active", "Tenant is not active")

        if custom_grant and not base_grant:
            return AuthorizationDecision(
                True,
                "tenant.access_group",
                "Assigned access group grants action",
            )
        return AuthorizationDecision(True, "tenant.capability", "Tenant attributes grant action")

    def capabilities(
        self,
        *,
        subject: AuthorizationSubject,
        resource: AuthorizationResource,
        environment: AuthorizationEnvironment,
    ) -> frozenset[AuthorizationAction]:
        return frozenset(
            action
            for action in TENANT_ACTIONS
            if self.decide(
                AuthorizationRequest(
                    subject=subject,
                    action=action,
                    resource=resource,
                    environment=environment,
                )
            ).allowed
        )


authorization_engine = AuthorizationEngine()
