from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.foundation.infra.config import Settings

_DEFAULT_LOCAL_ORIGINS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
)
_RESTORIO_HOST_SUFFIX = ".restorio.org"


def _build_allowed_origins(configured_origins: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    for origin in [*configured_origins, *_DEFAULT_LOCAL_ORIGINS]:
        if origin in seen:
            continue
        seen.add(origin)
        ordered.append(origin)

    return ordered


def is_origin_allowed(origin: str | None, configured_origins: list[str]) -> bool:
    if not origin:
        return False

    if origin in _build_allowed_origins(configured_origins):
        return True

    parsed = urlparse(origin)
    host = parsed.hostname
    if host is None:
        return False

    if host == "restorio.org" or host.endswith(_RESTORIO_HOST_SUFFIX):
        return parsed.scheme in {"http", "https"}

    return False


def setup_cors(app: FastAPI, settings: Settings) -> None:
    allow_origins = _build_allowed_origins(settings.CORS_ORIGINS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
