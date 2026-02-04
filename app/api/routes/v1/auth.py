from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.foundation.dependencies import PostgresSession
from modules.auth.database import create_user
from modules.email.service import send_activation_email

router = APIRouter()


class RegisterDetails(BaseModel):
    email: str
    password: str
    restaurant_name: str = Field(alias="restaurantName")


@router.post("/login")
async def login() -> dict[str, str]:
    return {"message": "Login endpoint - to be implemented"}


@router.post("/register", status_code=200)
async def register(data: RegisterDetails, session: PostgresSession):
    user, tenant = await create_user(
        session=session,
        email=data.email,
        password=data.password,
        restaurant_name=data.restaurant_name,
    )
    # activation_link = f"{settings.FRONTEND_URL}/activate?token={token}"
    activation_link = f"http://restorio.com/activate"
    await send_activation_email(
        to_email=user.email,
        restaurant_name=tenant.name,
        activation_link=activation_link,
    )
    return {
        "message": "Account created succesfully, you should receive email shortly",
        "id": str(user.id),
        "email": user.email,
        "account_type": user.account_type,
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
        },
    }


@router.post("/refresh")
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}