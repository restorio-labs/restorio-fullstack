from fastapi import APIRouter

from routes.v1.tenants.canvases import router as canvases_router
from routes.v1.tenants.menu import router as menu_router
from routes.v1.tenants.profile import router as profile_router
from routes.v1.tenants.tenants import router as tenants_router

router = APIRouter()

router.include_router(tenants_router, tags=["tenants"])
router.include_router(canvases_router, tags=["canvases"])
router.include_router(profile_router, tags=["profile"])
router.include_router(menu_router, tags=["menu"])
