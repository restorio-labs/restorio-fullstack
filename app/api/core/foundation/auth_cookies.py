from fastapi import Request, Response

from core.foundation.infra.config import settings


def _is_local_host(hostname: str | None) -> bool:
    if hostname is None:
        return False

    return hostname in {"localhost", "127.0.0.1"}


def _cookie_domain(_hostname: str | None) -> str | None:
    return None


def _should_use_secure_cookie(request: Request) -> bool:
    hostname = request.url.hostname
    if _is_local_host(hostname):
        return False

    return request.url.scheme == "https"


def set_auth_cookies(
    response: Response, request: Request, access_token: str, refresh_token: str
) -> None:
    hostname = request.url.hostname
    domain = _cookie_domain(hostname)
    secure = _should_use_secure_cookie(request)

    _clear_legacy_shared_auth_cookies(response, hostname, secure)

    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=domain,
    )
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
        domain=domain,
    )
    response.set_cookie(
        key=settings.SESSION_HINT_COOKIE,
        value="1",
        httponly=False,
        secure=secure,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
        domain=domain,
    )


def clear_auth_cookies(response: Response, request: Request) -> None:
    hostname = request.url.hostname
    domain = _cookie_domain(hostname)
    secure = _should_use_secure_cookie(request)

    response.delete_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        path="/",
        domain=domain,
        secure=secure,
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path="/",
        domain=domain,
        secure=secure,
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        key=settings.SESSION_HINT_COOKIE,
        path="/",
        domain=domain,
        secure=secure,
        httponly=False,
        samesite="lax",
    )

    _clear_legacy_shared_auth_cookies(response, hostname, secure)


def _clear_legacy_shared_auth_cookies(
    response: Response, hostname: str | None, secure: bool
) -> None:
    if hostname is None or not (hostname == "restorio.org" or hostname.endswith(".restorio.org")):
        return

    for key, httponly in [
        (settings.ACCESS_TOKEN_COOKIE_NAME, True),
        (settings.REFRESH_TOKEN_COOKIE_NAME, True),
        (settings.SESSION_HINT_COOKIE, False),
    ]:
        response.delete_cookie(
            key=key,
            path="/",
            domain=".restorio.org",
            secure=secure,
            httponly=httponly,
            samesite="lax",
        )


def get_access_token_from_request(request: Request) -> str | None:
    return request.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)


def get_refresh_token_from_request(request: Request) -> str | None:
    return request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
