from importlib import import_module
from unittest.mock import MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette import status

from core.foundation.dependencies import get_mongo_database, get_postgres_connection_pool


def test_template_routes_exercise_crud() -> None:
    tpl = import_module("routes.v1.__template__")
    app = FastAPI()
    app.include_router(tpl.router, prefix="/items")
    mdb = MagicMock()
    pool = MagicMock()

    async def o_m() -> object:
        yield mdb

    async def o_p() -> object:
        yield pool

    app.dependency_overrides[get_mongo_database] = o_m
    app.dependency_overrides[get_postgres_connection_pool] = o_p

    client = TestClient(app)
    r = client.get("/items", params={"page": 1, "page_size": 10})
    assert r.status_code == status.HTTP_200_OK

    r2 = client.get("/items/abc-123")
    assert r2.status_code == status.HTTP_200_OK
    assert r2.json()["data"]["id"] == "abc-123"

    r3 = client.post("/items")
    assert r3.status_code == status.HTTP_201_CREATED

    r4 = client.put("/items/xyz")
    assert r4.status_code == status.HTTP_200_OK

    r5 = client.delete("/items/del-1")
    assert r5.status_code == status.HTTP_200_OK
