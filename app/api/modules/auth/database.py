from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.security import hash_password
from core.models.user import User

async def create_user(
    *,
    session: AsyncSession,
    email: str,
    password: str,
    display_name: str | None,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user