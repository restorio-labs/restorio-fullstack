from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID

from core.authorization.actions import AuthorizationAction
from core.models.enums import AccountType, TenantStatus


@dataclass(frozen=True, slots=True)
class AuthorizationSubject:
    account_id: UUID
    tenant_role: AccountType | None = None
    attributes: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class AuthorizationResource:
    kind: str
    tenant_id: UUID | None = None
    resource_id: str | None = None
    tenant_status: TenantStatus | None = None
    attributes: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class AuthorizationEnvironment:
    occurred_at: datetime
    method: str
    path: str
    client_ip: str | None = None
    attributes: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class AuthorizationRequest:
    subject: AuthorizationSubject
    action: AuthorizationAction
    resource: AuthorizationResource
    environment: AuthorizationEnvironment


@dataclass(frozen=True, slots=True)
class AuthorizationDecision:
    allowed: bool
    policy_id: str
    reason: str


@dataclass(frozen=True, slots=True)
class TenantAuthorization:
    tenant_id: UUID
    tenant_public_id: str
    subject: AuthorizationSubject
    resource: AuthorizationResource
    environment: AuthorizationEnvironment
    decision: AuthorizationDecision
