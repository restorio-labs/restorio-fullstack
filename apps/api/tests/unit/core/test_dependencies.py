import pytest

from core.foundation import dependencies


class DummyPool:
    pass


class DummyMongoDatabase:
    pass


@pytest.mark.asyncio
async def test_get_mongo_database(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get_mongo_db() -> DummyMongoDatabase:
        return DummyMongoDatabase()

    monkeypatch.setattr(dependencies, "get_mongo_db", fake_get_mongo_db)

    database = await dependencies.get_mongo_database()

    assert isinstance(database, DummyMongoDatabase)


@pytest.mark.asyncio
async def test_get_postgres_connection_pool(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_get_postgres_pool() -> DummyPool:
        return DummyPool()

    monkeypatch.setattr(dependencies, "get_postgres_pool", fake_get_postgres_pool)

    pool = await dependencies.get_postgres_connection_pool()

    assert isinstance(pool, DummyPool)
