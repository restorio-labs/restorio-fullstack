from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    BadRequestError,
    GoneError,
    NotFoundError,
    TooManyRequestsError,
    UnauthorizedError,
)
from core.foundation.security import SecurityService
from core.models.activation_link import ActivationLink
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.user import User


class AuthService:
    def __init__(self, security: SecurityService) -> None:
        self._resend_cooldown_seconds = 300
        self.security = security

    async def create_activation_link(
        self,
        session: AsyncSession,
        email: str,
        user_id: UUID,
        tenant_id: UUID,
    ) -> ActivationLink:
        activation_link = ActivationLink(
            email=email,
            user_id=user_id,
            tenant_id=tenant_id,
            expires_at=datetime.now(tz=UTC) + timedelta(hours=24),
        )
        session.add(activation_link)
        await session.flush()
        await session.refresh(activation_link)
        return activation_link

    async def activate_account(
        self,
        session: AsyncSession,
        activation_id: UUID,
    ) -> tuple[Tenant, bool]:
        """Returns (tenant, already_activated)."""
        activation_link = await session.get(ActivationLink, activation_id)
        if activation_link is None:
            msg = "Activation link not found"
            raise NotFoundError(msg, str(activation_id))

        now = datetime.now(tz=UTC)
        if activation_link.expires_at < now:
            msg = "Activation link has expired"
            raise GoneError(msg)

        tenant = await session.get(Tenant, activation_link.tenant_id)
        if tenant is None:
            msg = "Account"
            raise NotFoundError(msg, "activation link")

        if activation_link.used_at is not None:
            return tenant, True

        user = await session.get(User, activation_link.user_id)
        if user is None:
            msg = "Account"
            raise NotFoundError(msg, "activation link")
        user.is_active = True
        tenant.status = TenantStatus.ACTIVE
        activation_link.used_at = now
        return tenant, False

    async def resend_activation_link(
        self,
        session: AsyncSession,
        activation_id: UUID,
    ) -> tuple[ActivationLink, Tenant]:
        """Resend only when link is expired. Cooldown is per activation link (last_resend_at)."""
        activation_link = await session.get(ActivationLink, activation_id)
        if activation_link is None:
            msg = "Activation link"
            raise NotFoundError(msg, str(activation_id))

        now = datetime.now(tz=UTC)
        if activation_link.used_at is not None:
            msg = "Account already activated"
            raise BadRequestError(msg)
        if activation_link.expires_at >= now:
            msg = "Activation link has not expired yet"
            raise BadRequestError(msg)

        if activation_link.last_resend_at is not None:
            elapsed = (now - activation_link.last_resend_at).total_seconds()
            if elapsed < self._resend_cooldown_seconds:
                msg = "Please wait before requesting another activation email."
                raise TooManyRequestsError(msg)

        activation_link.last_resend_at = now
        tenant = await session.get(Tenant, activation_link.tenant_id)
        if tenant is None:
            msg = "Account"
            raise NotFoundError(msg, "activation link")

        new_link = ActivationLink(
            email=activation_link.email,
            user_id=activation_link.user_id,
            tenant_id=activation_link.tenant_id,
            expires_at=now + timedelta(hours=24),
        )
        session.add(new_link)
        await session.flush()
        await session.refresh(new_link)
        return new_link, tenant

    async def login(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> str:
        user = await session.scalar(select(User).where(User.email == email))
        if user is None or not self.security.verify_password(password, user.password_hash):
            msg = "Invalid credentials"
            raise UnauthorizedError(msg)

        if not user.is_active:
            msg = "Account is not active"
            raise UnauthorizedError(msg)

        return self.security.create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            }
        )
