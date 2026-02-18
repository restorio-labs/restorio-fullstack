from datetime import UTC, datetime, timedelta

from bcrypt import checkpw, gensalt, hashpw
from fastapi import Request
from jose import JWTError, jwt

from core.exceptions.http import UnauthorizedError
from core.foundation.infra.config import settings
from core.foundation.logging.logger import logger


async def get_current_user(self, request: Request) -> dict | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise UnauthorizedError(message="Unauthorized")

    token = auth_header.split(" ")[1]
    return self.decode_access_token(token=token)


class SecurityService:
    def __init__(self) -> None:
        self._algorithm = settings.ALGORITHM
        self._secret_key = settings.SECRET_KEY
        self._access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    @staticmethod
    def hash_password(password: str) -> str:
        password_bytes = password.encode("utf-8")
        salt = gensalt()
        return hashpw(password_bytes, salt).decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(UTC) + expires_delta
        else:
            expire = datetime.now(UTC) + timedelta(minutes=self._access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)

    def decode_access_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
        except JWTError as err:
            logger.error(f"Invalid token: {err!s}", exc_info=True)

            raise UnauthorizedError(message="Unauthorized") from None
        except Exception as err:
            logger.error(f"Invalid token: {err!s}", exc_info=True)

            raise UnauthorizedError(message="Unauthorized") from None


security_service = SecurityService()
