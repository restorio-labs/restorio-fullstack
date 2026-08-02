from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import BadRequestError, GoneError, NotFoundResponse
from core.foundation.security import SecurityService
from core.models.password_reset_token import PasswordResetToken
from core.models.user import User
from services.auth_service import AuthService


def _service() -> AuthService:
    security = MagicMock(spec=SecurityService)
    security.hash_password.return_value = "new-password-hash"
    return AuthService(security=security)


@pytest.mark.asyncio
@pytest.mark.parametrize("user", [None, MagicMock(is_active=False)])
async def test_request_password_reset_ignores_unknown_or_inactive_user(user: object | None) -> None:
    session = MagicMock()
    session.scalar = AsyncMock(return_value=user)

    result = await _service().request_password_reset(session, " user@example.com ")

    assert result is None
    session.execute.assert_not_called()
    session.add.assert_not_called()


@pytest.mark.asyncio
async def test_request_password_reset_replaces_unused_token() -> None:
    user = User(id=uuid4(), email="user@example.com", password_hash="hash", is_active=True)
    session = MagicMock()
    session.scalar = AsyncMock(return_value=user)
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()

    token = await _service().request_password_reset(session, " user@example.com ")

    assert isinstance(token, PasswordResetToken)
    assert token.user_id == user.id
    assert token.email == user.email
    session.execute.assert_awaited_once()
    session.add.assert_called_once_with(token)
    session.flush.assert_awaited_once()
    session.refresh.assert_awaited_once_with(token)


@pytest.mark.asyncio
async def test_complete_password_reset_rejects_unknown_token() -> None:
    session = MagicMock()
    session.get = AsyncMock(return_value=None)

    with pytest.raises(NotFoundResponse, match="Password reset link not found"):
        await _service().complete_password_reset(session, uuid4(), "NewPass123!")


@pytest.mark.asyncio
async def test_complete_password_reset_rejects_expired_token() -> None:
    token = MagicMock(expires_at=datetime.now(UTC) - timedelta(seconds=1), used_at=None)
    session = MagicMock()
    session.get = AsyncMock(return_value=token)

    with pytest.raises(GoneError, match="expired"):
        await _service().complete_password_reset(session, uuid4(), "NewPass123!")


@pytest.mark.asyncio
async def test_complete_password_reset_rejects_used_token() -> None:
    now = datetime.now(UTC)
    token = MagicMock(expires_at=now + timedelta(hours=1), used_at=now)
    session = MagicMock()
    session.get = AsyncMock(return_value=token)

    with pytest.raises(BadRequestError, match="already been used"):
        await _service().complete_password_reset(session, uuid4(), "NewPass123!")


@pytest.mark.asyncio
async def test_complete_password_reset_rejects_missing_user() -> None:
    token = MagicMock(
        user_id=uuid4(),
        expires_at=datetime.now(UTC) + timedelta(hours=1),
        used_at=None,
    )
    session = MagicMock()
    session.get = AsyncMock(side_effect=[token, None])

    with pytest.raises(NotFoundResponse, match="Account"):
        await _service().complete_password_reset(session, uuid4(), "NewPass123!")


@pytest.mark.asyncio
async def test_complete_password_reset_updates_user_and_consumes_token() -> None:
    token = MagicMock(
        user_id=uuid4(),
        expires_at=datetime.now(UTC) + timedelta(hours=1),
        used_at=None,
    )
    user = User(
        id=token.user_id,
        email="user@example.com",
        password_hash="old-hash",
        is_active=True,
        force_password_change=True,
    )
    session = MagicMock()
    session.get = AsyncMock(side_effect=[token, user])
    service = _service()

    user_id = await service.complete_password_reset(session, uuid4(), "NewPass123!")

    assert user_id == user.id
    assert user.password_hash == "new-password-hash"
    assert user.force_password_change is False
    assert token.used_at is not None
    service.security.hash_password.assert_called_once_with("NewPass123!")
