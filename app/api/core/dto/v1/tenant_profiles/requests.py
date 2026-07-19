from typing import Self

from pydantic import Field, model_validator

from core.dto.v1.common import BaseDTO
from core.models.enums import GeocodingStatus, LocationPrecision, LocationSource


class LocationFieldsDTO(BaseDTO):
    latitude: float | None = Field(None, ge=-90, le=90, description="WGS84 latitude")
    longitude: float | None = Field(None, ge=-180, le=180, description="WGS84 longitude")
    geocoding_status: GeocodingStatus = Field(
        GeocodingStatus.NOT_GEOCODED,
        description="Current geocoding lifecycle status",
    )
    location_source: LocationSource | None = Field(
        None, description="Source used to establish the coordinates"
    )
    location_precision: LocationPrecision | None = Field(
        None, description="Precision of the stored coordinates"
    )
    is_location_public: bool = Field(
        False, description="Whether the restaurant location may be exposed publicly"
    )


class TenantLogoUploadPresignRequestDTO(BaseDTO):
    content_type: str = Field(
        ...,
        alias="contentType",
        serialization_alias="contentType",
        description="MIME type of the logo being uploaded",
    )
    file_name: str | None = Field(
        None,
        alias="fileName",
        serialization_alias="fileName",
        max_length=255,
        description="Original file name for display/debugging purposes",
    )


class CreateTenantProfileDTO(LocationFieldsDTO):
    nip: str = Field(
        ...,
        min_length=10,
        max_length=10,
        pattern=r"^\d{10}$",
        description="Polish tax identification number (NIP)",
    )
    company_name: str = Field(
        ..., min_length=1, max_length=255, description="Official registered company name"
    )
    logo: str | None = Field(None, max_length=512, description="URL to uploaded logo")
    logo_upload_key: str | None = Field(
        None,
        alias="logoUploadKey",
        serialization_alias="logoUploadKey",
        max_length=1024,
        description="Temporary MinIO object key to finalize as the tenant logo",
    )

    contact_email: str = Field(
        ..., min_length=1, max_length=255, description="Restaurant contact email"
    )
    phone: str = Field(..., min_length=1, max_length=20, description="Restaurant telephone number")

    address_street_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Street name",
    )
    address_street_number: str = Field(
        ...,
        min_length=1,
        max_length=20,
        description="Street/building number",
    )
    address_city: str = Field(..., min_length=1, max_length=100, description="City")
    address_postal_code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{2}-\d{3}$",
        description="Polish postal code (XX-XXX)",
    )
    address_country: str = Field(
        default="Polska", min_length=1, max_length=100, description="Country"
    )

    owner_first_name: str = Field(..., min_length=1, max_length=100, description="Owner first name")
    owner_last_name: str = Field(..., min_length=1, max_length=100, description="Owner last name")
    owner_email: str | None = Field(None, max_length=255, description="Owner email")
    owner_phone: str | None = Field(None, max_length=20, description="Owner phone number")

    contact_person_first_name: str | None = Field(
        None, max_length=100, description="Contact person first name"
    )
    contact_person_last_name: str | None = Field(
        None, max_length=100, description="Contact person last name"
    )
    contact_person_email: str | None = Field(
        None, max_length=255, description="Contact person email"
    )
    contact_person_phone: str | None = Field(
        None, max_length=20, description="Contact person phone number"
    )

    social_facebook: str | None = Field(None, max_length=512, description="Facebook page URL")
    social_instagram: str | None = Field(None, max_length=512, description="Instagram profile URL")
    social_tiktok: str | None = Field(None, max_length=512, description="TikTok profile URL")
    social_website: str | None = Field(None, max_length=512, description="Restaurant website URL")

    @model_validator(mode="after")
    def validate_location(self) -> Self:
        has_latitude = self.latitude is not None
        has_longitude = self.longitude is not None
        if has_latitude != has_longitude:
            msg = "Latitude and longitude must be provided together"
            raise ValueError(msg)

        has_coordinates = has_latitude and has_longitude
        if self.is_location_public and not has_coordinates:
            msg = "A public location requires coordinates"
            raise ValueError(msg)
        if self.location_source is not None and not has_coordinates:
            msg = "Location source requires coordinates"
            raise ValueError(msg)
        if self.location_precision is not None and not has_coordinates:
            msg = "Location precision requires coordinates"
            raise ValueError(msg)
        if self.geocoding_status == GeocodingStatus.GEOCODED and not has_coordinates:
            msg = "Geocoded status requires coordinates"
            raise ValueError(msg)

        return self


class UpdateTenantProfileDTO(LocationFieldsDTO):
    nip: str | None = Field(
        None,
        min_length=10,
        max_length=10,
        pattern=r"^\d{10}$",
        description="Polish tax identification number (NIP)",
    )
    company_name: str | None = Field(
        None, min_length=1, max_length=255, description="Official registered company name"
    )
    logo: str | None = Field(None, max_length=512, description="URL to uploaded logo")
    logo_upload_key: str | None = Field(
        None,
        alias="logoUploadKey",
        serialization_alias="logoUploadKey",
        max_length=1024,
        description="Temporary MinIO object key to finalize as the tenant logo",
    )

    contact_email: str | None = Field(
        None, min_length=1, max_length=255, description="Restaurant contact email"
    )
    phone: str | None = Field(
        None, min_length=1, max_length=20, description="Restaurant telephone number"
    )

    address_street_name: str | None = Field(
        None, min_length=1, max_length=255, description="Street name"
    )
    address_street_number: str | None = Field(
        None, min_length=1, max_length=20, description="Street/building number"
    )
    address_city: str | None = Field(None, min_length=1, max_length=100, description="City")
    address_postal_code: str | None = Field(
        None,
        min_length=6,
        max_length=6,
        pattern=r"^\d{2}-\d{3}$",
        description="Polish postal code (XX-XXX)",
    )
    address_country: str | None = Field(None, min_length=1, max_length=100, description="Country")

    owner_first_name: str | None = Field(
        None, min_length=1, max_length=100, description="Owner first name"
    )
    owner_last_name: str | None = Field(
        None, min_length=1, max_length=100, description="Owner last name"
    )
    owner_email: str | None = Field(None, max_length=255, description="Owner email")
    owner_phone: str | None = Field(None, max_length=20, description="Owner phone number")

    contact_person_first_name: str | None = Field(
        None, max_length=100, description="Contact person first name"
    )
    contact_person_last_name: str | None = Field(
        None, max_length=100, description="Contact person last name"
    )
    contact_person_email: str | None = Field(
        None, max_length=255, description="Contact person email"
    )
    contact_person_phone: str | None = Field(
        None, max_length=20, description="Contact person phone number"
    )

    social_facebook: str | None = Field(None, max_length=512, description="Facebook page URL")
    social_instagram: str | None = Field(None, max_length=512, description="Instagram profile URL")
    social_tiktok: str | None = Field(None, max_length=512, description="TikTok profile URL")
    social_website: str | None = Field(None, max_length=512, description="Restaurant website URL")
