from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from uuid import UUID

import resend
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    BadRequestError,
    GoneError,
    NotFoundError,
    TooManyRequestsError,
)
from core.foundation.infra.config import settings
from core.models.activation_link import ActivationLink
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.user import User


class EmailService:
    def __init__(self) -> None:
        self._resend_api_key = settings.RESEND_API_KEY.strip()
        self._resend_from_email = settings.RESEND_FROM_EMAIL.strip()

    def _get_resend_settings(self) -> tuple[str, str]:
        if not self._resend_api_key:
            msg = "RESEND_API_KEY is required to send emails."
            raise RuntimeError(msg)
        if not self._resend_from_email:
            msg = "RESEND_FROM_EMAIL is required to send emails."
            raise RuntimeError(msg)
        return self._resend_api_key, self._resend_from_email

    async def send_activation_email(
        self,
        to_email: str,
        restaurant_name: str,
        activation_link: str,
    ) -> None:
        resend_api_key, resend_from_email = self._get_resend_settings()
        resend.api_key = resend_api_key

        subject = f"Activate your {restaurant_name} account"
        html = f"""
        <p>Welcome to Restorio, {restaurant_name}!</p>
        <p>Please activate your account:</p>
        <p><a href="{activation_link}">Activate my account</a></p>
        """

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
        )

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
