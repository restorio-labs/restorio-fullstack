from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.exceptions import RestorioException
from core.middleware import TimingMiddleware, UnauthorizedMiddleware
from core.schemas import ErrorResponse
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

    app.add_middleware(TimingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(UnauthorizedMiddleware)

    @app.exception_handler(RestorioException)
    async def restorio_exception_handler(_: Request, exc: RestorioException) -> JSONResponse:
        error_response = ErrorResponse(
            error_code=exc.error_code,
            message=exc.detail,
            details=exc.details,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response.model_dump(exclude_none=True),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        error_response = ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            details={"type": type(exc).__name__} if settings.DEBUG else None,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.model_dump(exclude_none=True),
        )

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
