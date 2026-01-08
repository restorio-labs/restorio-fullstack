from fastapi import FastAPI

from core.foundation.infra.config import settings
from core.exceptions.handlers import setup_exception_handlers
from core.middleware import TimingMiddleware, UnauthorizedMiddleware, setup_cors
from routes import api_router as api_router_v1
from routes import health as health_route


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )

    setup_cors(app=app, settings=settings)
    setup_exception_handlers(app=app, settings=settings)

    app.add_middleware(TimingMiddleware)
    app.add_middleware(UnauthorizedMiddleware)

    @app.get("/")
    def read_root() -> dict[str, str]:
        return {
            "message": "Welcome to Restorio API",
            "version": settings.VERSION,
            "docs": "/docs" if settings.DEBUG else "disabled",
            "api_version": "v1",
            "api_prefix": settings.API_V1_PREFIX,
        }

    app.include_router(api_router_v1, prefix=settings.API_V1_PREFIX)
    app.include_router(health_route.router, prefix="/health", tags=["health"])
    return app


app = create_application()
