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


@router.post("/register")
async def register(data: registerDetails, session: PostgresSession):
    user = await create_user(
        session=session,
        email=data.email,
        password=data.password,
        display_name=data.restaurantName,
    )
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "is_active": user.is_active,
    }


@router.post("/refresh")
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}
