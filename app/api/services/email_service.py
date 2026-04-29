from __future__ import annotations

import asyncio

import resend

from core.foundation.infra.config import settings


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
        activation_link: str,
        restaurant_name: str | None = None,
    ) -> None:
        resend_api_key, resend_from_email = self._get_resend_settings()
        resend.api_key = resend_api_key

        if restaurant_name:
            subject = f"Aktywuj konto dla restauracji {restaurant_name}"
            greeting = "Witamy w Restorio!"
            html = f"""
            <p>{greeting}</p>
            <p>Aktywuj swoje konto dla restauracji {restaurant_name}, klikając w poniższy link:</p>
            <p><a href="{activation_link}">Link aktywacyjny</a></p>
            <p>Jeśli nie tworzyłeś konta w naszym serwisie, proszę zignorować tę wiadomość.</p>
            """

        else:
            subject = "Aktywuj swoje konto Restorio"
            greeting = "Witamy w Restorio!"
            html = f"""
            <p>{greeting}</p>
            <p>Aktywuj swoje konto, klikając w poniższy link:</p>
            <p><a href="{activation_link}">Link aktywacyjny</a></p>
            <p>Jeśli nie tworzyłeś konta w naszym serwisie, proszę zignorować tę wiadomość.</p>
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
