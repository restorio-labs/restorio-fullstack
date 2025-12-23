from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import get_mongo_db, get_postgres_pool


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def read_root() -> dict[str, str]:
        return {"message": "Welcome to Restorio API"}

    @app.get("/health")
    async def health_check() -> dict[str, str]:
        status = "healthy"
        mongodb_status = "up"
        postgres_status = "up"

        try:
            db = get_mongo_db()
            await db.command("ping")
        except Exception as e:
            mongodb_status = "down"
            status = "degraded"

        try:
            pool = await get_postgres_pool()
            async with pool.acquire() as connection:
                await connection.execute("SELECT 1")
        except Exception as e:
            postgres_status = "down"
            status = "degraded"

        result = {
            "status": status,
            "mongodb": mongodb_status,
            "postgres": postgres_status,
        }
        return result

    return app


app = create_application()

