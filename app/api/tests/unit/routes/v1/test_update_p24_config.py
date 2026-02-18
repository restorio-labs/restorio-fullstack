from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException
import pytest

from api.v1.dto.payments import UpdateP24ConfigDTO
from core.foundation.http.schemas import UpdatedResponse
from core.models.enums import TenantStatus
from routes.v1.payments.update_p24_config import update_p24_config


def _make_tenant(
    tenant_id=None,
    name="Test Restaurant",
    slug="test-restaurant",
    status=TenantStatus.ACTIVE,
    p24_merchantid=None,
    p24_api=None,
    p24_crc=None,
):
    tenant = MagicMock()
    tenant.id = tenant_id or uuid4()
    tenant.name = name
    tenant.slug = slug
    tenant.status = status
    tenant.created_at = datetime.now(UTC)
    tenant.p24_merchantid = p24_merchantid
    tenant.p24_api = p24_api
    tenant.p24_crc = p24_crc
    return tenant


def _make_session(tenant=None):
    session = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = tenant
    session.execute.return_value = result_mock
    return session


class TestUpdateP24Config:
    @pytest.mark.asyncio
    async def test_updates_tenant_p24_fields(self) -> None:
        tenant = _make_tenant()
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(
            p24_merchantid=123456, p24_api="api-key-abc", p24_crc="crc-key-xyz"
        )

        result = await update_p24_config(tenant.id, request, session)

        assert tenant.p24_merchantid == 123456
        assert tenant.p24_api == "api-key-abc"
        assert tenant.p24_crc == "crc-key-xyz"

    @pytest.mark.asyncio
    async def test_commits_and_refreshes_session(self) -> None:
        tenant = _make_tenant()
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(p24_merchantid=1, p24_api="key", p24_crc="crc")

        await update_p24_config(tenant.id, request, session)

        session.commit.assert_awaited_once()
        session.refresh.assert_awaited_once_with(tenant)

    @pytest.mark.asyncio
    async def test_returns_updated_response_with_tenant_data(self) -> None:
        tenant = _make_tenant(name="My Venue", slug="my-venue", status=TenantStatus.ACTIVE)
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(p24_merchantid=999, p24_api="k", p24_crc="c")

        result = await update_p24_config(tenant.id, request, session)

        assert isinstance(result, UpdatedResponse)
        assert result.message == "P24 config updated successfully"
        assert result.data.id == tenant.id
        assert result.data.name == "My Venue"
        assert result.data.slug == "my-venue"
        assert result.data.status == TenantStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_raises_404_when_tenant_not_found(self) -> None:
        session = _make_session(tenant=None)
        tenant_id = uuid4()
        request = UpdateP24ConfigDTO(p24_merchantid=1, p24_api="key", p24_crc="crc")

        with pytest.raises(HTTPException) as exc_info:
            await update_p24_config(tenant_id, request, session)

        assert exc_info.value.status_code == 404
        assert str(tenant_id) in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_overwrites_existing_p24_config(self) -> None:
        tenant = _make_tenant(p24_merchantid=111, p24_api="old-api", p24_crc="old-crc")
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(p24_merchantid=222, p24_api="new-api", p24_crc="new-crc")

        await update_p24_config(tenant.id, request, session)

        assert tenant.p24_merchantid == 222
        assert tenant.p24_api == "new-api"
        assert tenant.p24_crc == "new-crc"


class TestUpdateP24ConfigDTOValidation:
    def test_valid_dto(self) -> None:
        dto = UpdateP24ConfigDTO(p24_merchantid=123456, p24_api="api-key", p24_crc="crc-key")
        assert dto.p24_merchantid == 123456
        assert dto.p24_api == "api-key"
        assert dto.p24_crc == "crc-key"

    def test_merchant_id_max_6_digits(self) -> None:
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1_000_000, p24_api="key", p24_crc="crc")

    def test_merchant_id_cannot_be_negative(self) -> None:
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=-1, p24_api="key", p24_crc="crc")

    def test_api_key_max_length_32(self) -> None:
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1, p24_api="a" * 33, p24_crc="crc")

    def test_crc_key_max_length_16(self) -> None:
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1, p24_api="key", p24_crc="a" * 17)

    def test_boundary_values_accepted(self) -> None:
        dto = UpdateP24ConfigDTO(p24_merchantid=999_999, p24_api="a" * 32, p24_crc="b" * 16)
        assert dto.p24_merchantid == 999_999
        assert len(dto.p24_api) == 32
        assert len(dto.p24_crc) == 16

    def test_zero_merchant_id_accepted(self) -> None:
        dto = UpdateP24ConfigDTO(p24_merchantid=0, p24_api="key", p24_crc="crc")
        assert dto.p24_merchantid == 0
