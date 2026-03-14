from fastapi import APIRouter, status
from minio import Minio

from core.foundation.database.connection import get_mongo_db, get_postgres_pool
from core.foundation.infra.config import settings

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    status = "healthy"
    mongodb_status = "up"
    postgres_status = "up"
    minio_status = "up"

    try:
        db = get_mongo_db()
        await db.command("ping")
    except Exception:
        mongodb_status = "down"
        status = "degraded"

    try:
        minio = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        minio.bucket_exists(settings.MINIO_BUCKET)
    except Exception:
        minio_status = "down"
        status = "degraded"

    try:
        pool = await get_postgres_pool()
        async with pool.acquire() as connection:
            await connection.execute("SELECT 1")
    except Exception:
        postgres_status = "down"
        status = "degraded"

    return {
        "status": status,
        "mongodb": mongodb_status,
        "minio": minio_status,
        "postgres": postgres_status,
    }
