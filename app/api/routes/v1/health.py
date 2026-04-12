from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from minio import Minio

from core.foundation.database.connection import get_mongo_db, get_postgres_pool
from core.foundation.infra.config import settings

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def health_check() -> JSONResponse:
    ok = True

    try:
        db = get_mongo_db()
        await db.command("ping")
    except Exception:
        ok = False

    if ok:
        try:
            minio = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
            minio.bucket_exists(settings.MINIO_BUCKET)
        except Exception:
            ok = False

    if ok:
        try:
            pool = await get_postgres_pool()
            async with pool.acquire() as connection:
                await connection.execute("SELECT 1")
        except Exception:
            ok = False

    if ok:
        return JSONResponse(status_code=status.HTTP_200_OK, content={})

    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={})
