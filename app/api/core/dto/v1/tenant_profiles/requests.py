from pydantic import Field

from core.dto.v1.common import BaseDTO


class CreateTenantProfileDTO(BaseDTO):
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
    logo_url: str | None = Field(None, max_length=512, description="URL to uploaded logo")

    contact_email: str = Field(
        ..., min_length=1, max_length=255, description="Restaurant contact email"
    )
    phone: str = Field(..., min_length=1, max_length=20, description="Restaurant telephone number")

    address_street: str = Field(..., min_length=1, max_length=255, description="Street address")
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


class UpdateTenantProfileDTO(BaseDTO):
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
    logo_url: str | None = Field(None, max_length=512, description="URL to uploaded logo")

    contact_email: str | None = Field(
        None, min_length=1, max_length=255, description="Restaurant contact email"
    )
    phone: str | None = Field(
        None, min_length=1, max_length=20, description="Restaurant telephone number"
    )

    address_street: str | None = Field(
        None, min_length=1, max_length=255, description="Street address"
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
