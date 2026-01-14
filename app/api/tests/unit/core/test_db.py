import pytest

from core.foundation.database import connection as db


class FakeMongoDatabase:
    def __init__(self, name: str) -> None:
        self.name = name


class FakeMongoClient:
    def __init__(self, url: str) -> None:
        self.url = url
        self.databases: dict[str, FakeMongoDatabase] = {}

    def __getitem__(self, name: str) -> FakeMongoDatabase:
        if name not in self.databases:
            self.databases[name] = FakeMongoDatabase(name)
        return self.databases[name]


class FakePostgresPool:
    def __init__(self) -> None:
        self.created = True


@pytest.mark.asyncio
async def test_get_mongo_client_singleton(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_client(url: str) -> FakeMongoClient:
        return FakeMongoClient(url)

    monkeypatch.setattr(db, "AsyncIOMotorClient", fake_client)

    client1 = db.DatabaseConnections.get_mongo_client()
    client2 = db.DatabaseConnections.get_mongo_client()

    assert isinstance(client1, FakeMongoClient)
    assert client1 is client2


def test_get_mongo_client_wrapper(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeMongoClient("mongodb://wrapper-test")

    def fake_get_mongo_client() -> FakeMongoClient:
        return client

    monkeypatch.setattr(db.DatabaseConnections, "get_mongo_client", fake_get_mongo_client)

    result = db.get_mongo_client()

    assert result is client


def test_get_mongo_db_returns_named_database(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeMongoClient("mongodb://test")

    def fake_get_client() -> FakeMongoClient:
        return client

    monkeypatch.setattr(db, "get_mongo_client", fake_get_client)

    database = db.get_mongo_db()

    assert isinstance(database, FakeMongoDatabase)
    assert database.name is not None


@pytest.mark.asyncio
async def test_get_postgres_pool_singleton(monkeypatch: pytest.MonkeyPatch) -> None:
    pools: list[FakePostgresPool] = []

    async def fake_create_pool(*_: object, **__: object) -> FakePostgresPool:
        pool = FakePostgresPool()
        pools.append(pool)
        return pool

    monkeypatch.setattr(db.asyncpg, "create_pool", fake_create_pool)

    pool1 = await db.DatabaseConnections.get_postgres_pool()
    pool2 = await db.DatabaseConnections.get_postgres_pool()

    assert isinstance(pool1, FakePostgresPool)
    assert pool1 is pool2
    assert len(pools) == 1


@pytest.mark.asyncio
async def test_get_postgres_pool_function(monkeypatch: pytest.MonkeyPatch) -> None:
    pool = FakePostgresPool()

    async def fake_get_pool() -> FakePostgresPool:
        return pool

    monkeypatch.setattr(db.DatabaseConnections, "get_postgres_pool", fake_get_pool)

    result = await db.get_postgres_pool()

    assert result is pool
