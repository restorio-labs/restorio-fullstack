# from routes.v1.menus import router as menus_router  # noqa: ERA001
from routes.v1.orders import router as orders_router
from routes.v1.payments import router as payments_router
from routes.v1.restaurants import router as restaurants_router
from routes.v1.tenants import router as tenants_router

# from routes.v1.users import router as users_router  # noqa: ERA001

__all__ = [
    "orders_router",
    "payments_router",
    "restaurants_router",
    "tenants_router",
    # "users_router",
]
