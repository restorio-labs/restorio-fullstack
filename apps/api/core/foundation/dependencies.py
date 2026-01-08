from typing import Annotated

from asyncpg import Pool
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.database.connection import get_mongo_db, get_postgres_pool
from core.foundation.database.database import get_db_session


async def get_mongo_database() -> AsyncIOMotorDatabase:
    return get_mongo_db()


async def get_postgres_connection_pool() -> Pool:
    return await get_postgres_pool()


MongoDB = Annotated[AsyncIOMotorDatabase, Depends(get_mongo_database)]
PostgresPool = Annotated[Pool, Depends(get_postgres_connection_pool)]
PostgresSession = Annotated[AsyncSession, Depends(get_db_session)]
