from datetime import timedelta

from core.foundation.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestCreateAccessToken:
    def test_create_access_token_with_default_expiry(self) -> None:
        data = {"sub": "test@example.com"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "test@example.com"
        assert "exp" in decoded

    def test_create_access_token_with_custom_expiry(self) -> None:
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta=expires_delta)

        assert isinstance(token, str)
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "test@example.com"

    def test_create_access_token_preserves_data(self) -> None:
        data = {"sub": "user@example.com", "role": "admin", "tenant_id": "123"}
        token = create_access_token(data)

        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "user@example.com"
        assert decoded["role"] == "admin"
        assert decoded["tenant_id"] == "123"


class TestDecodeAccessToken:
    def test_decode_valid_token(self) -> None:
        data = {"sub": "test@example.com"}
        token = create_access_token(data)

        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "test@example.com"

    def test_decode_invalid_token(self) -> None:
        invalid_token = "invalid.token.here"
        decoded = decode_access_token(invalid_token)
        assert decoded is None

    def test_decode_empty_token(self) -> None:
        decoded = decode_access_token("")
        assert decoded is None

    def test_decode_malformed_token(self) -> None:
        malformed_token = "not.a.valid.jwt.token"
        decoded = decode_access_token(malformed_token)
        assert decoded is None


class TestHashPassword:
    def test_hash_password_returns_different_hash(self) -> None:
        password = "test_password_123"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")

    def test_hash_password_same_password_different_hashes(self) -> None:
        password = "test_password_123"
        hashed1 = hash_password(password)
        hashed2 = hash_password(password)

        assert hashed1 != hashed2

    def test_hash_password_empty_string(self) -> None:
        password = ""
        hashed = hash_password(password)

        assert len(hashed) > 0
        assert hashed.startswith("$2b$")


class TestVerifyPassword:
    def test_verify_password_correct(self) -> None:
        password = "test_password_123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self) -> None:
        password = "test_password_123"
        hashed = hash_password(password)

        assert verify_password("wrong_password", hashed) is False

    def test_verify_password_empty_password(self) -> None:
        password = ""
        hashed = hash_password(password)

        assert verify_password("", hashed) is True
        assert verify_password("not_empty", hashed) is False

    def test_verify_password_case_sensitive(self) -> None:
        password = "TestPassword"
        hashed = hash_password(password)

        assert verify_password("TestPassword", hashed) is True
        assert verify_password("testpassword", hashed) is False
        assert verify_password("TESTPASSWORD", hashed) is False
