from typing import Annotated

from fastapi import Depends

from core.db import get_mongo_db, get_postgres_pool
from motor.motor_asyncio import AsyncIOMotorDatabase
from asyncpg import Pool


async def get_mongo_database() -> AsyncIOMotorDatabase:
    return get_mongo_db()


async def get_postgres_connection_pool() -> Pool:
    return await get_postgres_pool()


MongoDB = Annotated[AsyncIOMotorDatabase, Depends(get_mongo_database)]
PostgresPool = Annotated[Pool, Depends(get_postgres_connection_pool)]

