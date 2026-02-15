from __future__ import annotations

import asyncio

import resend

from core.foundation.infra.config import settings


def _get_resend_settings() -> tuple[str, str]:
    resend_api_key = settings.RESEND_API_KEY.strip()
    resend_from_email = settings.RESEND_FROM_EMAIL.strip()
    if not resend_api_key:
        msg = "RESEND_API_KEY is required to send emails."
        raise RuntimeError(msg)
    if not resend_from_email:
        msg = "RESEND_FROM_EMAIL is required to send emails."
        raise RuntimeError(msg)
    return resend_api_key, resend_from_email


async def send_activation_email(
    *,
    to_email: str,
    restaurant_name: str,
    activation_link: str,
) -> None:
    resend_api_key, resend_from_email = _get_resend_settings()
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
