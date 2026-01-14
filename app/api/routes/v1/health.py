from fastapi import APIRouter

from core.foundation.database.connection import get_mongo_db, get_postgres_pool

router = APIRouter()


@router.get("")
async def health_check() -> dict[str, str]:
    status = "healthy"
    mongodb_status = "up"
    postgres_status = "up"

    try:
        db = get_mongo_db()
        await db.command("ping")
    except Exception:
        mongodb_status = "down"
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
        "postgres": postgres_status,
    }
