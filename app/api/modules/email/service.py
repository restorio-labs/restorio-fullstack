from __future__ import annotations

import resend

from core.foundation.infra.config import settings

resend.api_key = settings.RESEND_API_KEY


async def send_activation_email(
    *,
    to_email: str,
    restaurant_name: str,
    activation_link: str,
) -> None:
    subject = f"Activate your {restaurant_name} account"
    html = f"""
    <p>Welcome to Restorio, {restaurant_name}!</p>
    <p>Please activate your account:</p>
    <p><a href="{activation_link}">Activate my account</a></p>
    """

    resend.Emails.send(
        {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html,
        }
    )
