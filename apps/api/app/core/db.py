from typing import Optional

import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


_mongo_client: Optional[AsyncIOMotorClient] = None
_postgres_pool: Optional[asyncpg.Pool] = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.DATABASE_URL)
    return _mongo_client


def get_mongo_db() -> AsyncIOMotorDatabase:
    client = get_mongo_client()
    return client[settings.DATABASE_NAME]


async def get_postgres_pool() -> asyncpg.Pool:
    global _postgres_pool
    if _postgres_pool is None:
        _postgres_pool = await asyncpg.create_pool(dsn=settings.POSTGRES_DSN)
    return _postgres_pool


