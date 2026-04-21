from __future__ import annotations

from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from starlette import status

from routes.v1.health import health_check


@asynccontextmanager
async def _acquire_conn() -> object:
    conn = MagicMock()
    conn.execute = AsyncMock()
    yield conn


def _make_pool() -> MagicMock:
    pool = MagicMock()

    def _acquire() -> object:
        return _acquire_conn()

    pool.acquire = _acquire
    return pool


@pytest.mark.asyncio
async def test_health_check_all_backends_ok() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock()
    p = _make_pool()
    minio = MagicMock()
    minio.bucket_exists.return_value = True

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.get_postgres_pool", new_callable=AsyncMock, return_value=p),
        patch("routes.v1.health.Minio", return_value=minio),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_health_check_mongo_failure_returns_503() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock(side_effect=RuntimeError("down"))

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.get_postgres_pool", new_callable=AsyncMock),
        patch("routes.v1.health.Minio"),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.asyncio
async def test_health_check_minio_failure_returns_503() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock()
    minio = MagicMock()
    minio.bucket_exists.side_effect = RuntimeError("no minio")

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.get_postgres_pool", new_callable=AsyncMock),
        patch("routes.v1.health.Minio", return_value=minio),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.asyncio
async def test_health_check_postgres_failure_returns_503() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock()
    minio = MagicMock()
    minio.bucket_exists.return_value = True
    p = MagicMock()
    p.acquire = MagicMock(side_effect=RuntimeError("pg"))

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.get_postgres_pool", new_callable=AsyncMock, return_value=p),
        patch("routes.v1.health.Minio", return_value=minio),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
