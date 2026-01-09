import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.foundation.infra.config import settings


class DatabaseConnections:
    _mongo_client: AsyncIOMotorClient | None = None
    _postgres_pool: asyncpg.Pool | None = None

    @classmethod
    def get_mongo_client(cls) -> AsyncIOMotorClient:
        if cls._mongo_client is None:
            cls._mongo_client = AsyncIOMotorClient(settings.DATABASE_URL)
        return cls._mongo_client

    @classmethod
    async def get_postgres_pool(cls) -> asyncpg.Pool:
        if cls._postgres_pool is None:
            cls._postgres_pool = await asyncpg.create_pool(dsn=settings.POSTGRES_DSN)
        return cls._postgres_pool


def get_mongo_client() -> AsyncIOMotorClient:
    return DatabaseConnections.get_mongo_client()


def get_mongo_db() -> AsyncIOMotorDatabase:
    client = get_mongo_client()
    return client[settings.DATABASE_NAME]


async def get_postgres_pool() -> asyncpg.Pool:
    return await DatabaseConnections.get_postgres_pool()
