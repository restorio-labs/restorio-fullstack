from pydantic import ValidationError
import pytest

from core.dto.v1.tenant_profiles import CreateTenantProfileDTO

LATITUDE = 52.2297
LONGITUDE = 21.0122


def _profile_data(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "nip": "1234567890",
        "company_name": "Restaurant",
        "contact_email": "contact@example.com",
        "phone": "+48123456789",
        "address_street_name": "Main",
        "address_street_number": "1",
        "address_city": "Warsaw",
        "address_postal_code": "00-001",
        "owner_first_name": "A",
        "owner_last_name": "B",
    }
    data.update(overrides)
    return data


def test_location_defaults_are_safe_for_legacy_profiles() -> None:
    dto = CreateTenantProfileDTO.model_validate(_profile_data())

    assert dto.latitude is None
    assert dto.longitude is None
    assert dto.geocoding_status == "not_geocoded"
    assert dto.location_source is None
    assert dto.location_precision is None
    assert dto.is_location_public is False


def test_accepts_complete_public_location() -> None:
    dto = CreateTenantProfileDTO.model_validate(
        _profile_data(
            latitude=LATITUDE,
            longitude=LONGITUDE,
            geocoding_status="geocoded",
            location_source="manual",
            location_precision="rooftop",
            is_location_public=True,
        )
    )

    assert dto.latitude == LATITUDE
    assert dto.longitude == LONGITUDE
    assert dto.is_location_public is True


@pytest.mark.parametrize(
    "location",
    [
        {"latitude": LATITUDE},
        {"longitude": LONGITUDE},
        {"is_location_public": True},
        {"location_source": "manual"},
        {"location_precision": "rooftop"},
        {"geocoding_status": "geocoded"},
        {"latitude": 91, "longitude": LONGITUDE},
        {"latitude": LATITUDE, "longitude": 181},
    ],
)
def test_rejects_incomplete_or_invalid_location(location: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        CreateTenantProfileDTO.model_validate(_profile_data(**location))
