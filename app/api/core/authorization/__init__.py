"""Tenant-scoped attribute-based authorization."""

from core.authorization.actions import AuthorizationAction
from core.authorization.engine import AuthorizationEngine, authorization_engine
from core.authorization.models import (
    AuthorizationDecision,
    AuthorizationEnvironment,
    AuthorizationRequest,
    AuthorizationResource,
    AuthorizationSubject,
    TenantAuthorization,
)

__all__ = [
    "AuthorizationAction",
    "AuthorizationDecision",
    "AuthorizationEngine",
    "AuthorizationEnvironment",
    "AuthorizationRequest",
    "AuthorizationResource",
    "AuthorizationSubject",
    "TenantAuthorization",
    "authorization_engine",
]
