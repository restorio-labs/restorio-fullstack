from fastapi import APIRouter

from routes.v1.auth import router as auth_router
from routes.v1.health import router as health_router
from routes.v1.orders import router as orders_router
from routes.v1.payments import router as payments_router
from routes.v1.tenants import router as tenants_router
from routes.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

api_router.include_router(tenants_router, prefix="/tenants")

api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(payments_router, prefix="/payments")
