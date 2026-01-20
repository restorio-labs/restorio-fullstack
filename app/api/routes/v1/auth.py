from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from core.foundation.dependencies import PostgresSession
from core.foundation.http.schemas import CreatedResponse
from core.models import Tenant, User, UserTenant

router = APIRouter()
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    restaurant_name: str = Field(min_length=1, max_length=255)


class RegisterResult(BaseModel):
    user_id: str
    tenant_id: str


@router.post("/login")
async def login() -> dict[str, str]:
    return {"message": "Login endpoint - to be implemented"}


def slugify(name: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", name.strip().lower())
    slug = normalized.strip("-")
    return slug or "restaurant"


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterPayload,
    session: PostgresSession,
) -> CreatedResponse[RegisterResult]:
    existing_user = await session.execute(select(User).where(User.email == payload.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    base_slug = slugify(payload.restaurant_name)
    slug = base_slug
    suffix = 1
    while True:
        existing_tenant = await session.execute(select(Tenant).where(Tenant.slug == slug))
        if not existing_tenant.scalar_one_or_none():
            break
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    password_hash = password_context.hash(payload.password)
    user = User(email=payload.email, password_hash=password_hash)
    tenant = Tenant(name=payload.restaurant_name, slug=slug)
    user_tenant = UserTenant(user=user, tenant=tenant, role="owner")

    session.add_all([user, tenant, user_tenant])
    try:
        await session.flush()
    except IntegrityError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already exists") from exc

    return CreatedResponse[RegisterResult](
        message="Account created successfully",
        data=RegisterResult(user_id=str(user.id), tenant_id=str(tenant.id)),
    )


@router.post("/refresh")
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}
