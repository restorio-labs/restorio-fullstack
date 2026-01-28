from fastapi import APIRouter
from pydantic import BaseModel
from core.foundation.dependencies import PostgresSession
from modules.auth.database import create_user

router = APIRouter()

class registerDetails(BaseModel):
    email: str
    password: str
    restaurantName: str


@router.post("/login")
async def login() -> dict[str, str]:
    return {"message": "Login endpoint - to be implemented"}


@router.post("/register", status_code=200)
async def register(data: registerDetails, session: PostgresSession):
    user, tenant = await create_user(
        session=session,
        email=data.email,
        password=data.password,
        restaurant_name=data.restaurantName,
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
