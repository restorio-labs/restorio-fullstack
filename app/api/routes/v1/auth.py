from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
async def login() -> dict[str, str]:
    return {"message": "Login endpoint - to be implemented"}


@router.post("/register")
async def register() -> dict[str, str]:
    return {"message": "Register endpoint - to be implemented"}


@router.post("/refresh")
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}