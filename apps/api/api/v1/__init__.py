from fastapi import APIRouter

from api.v1.routes import auth, health, orders, restaurants, tenants

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
