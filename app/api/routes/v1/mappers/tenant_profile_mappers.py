from core.dto.v1.tenant_profiles import TenantProfileResponseDTO
from core.models import TenantProfile


def tenant_profile_to_response(profile: TenantProfile) -> TenantProfileResponseDTO:
    return TenantProfileResponseDTO(
        id=profile.id,
        tenantId=profile.tenant_id,
        nip=profile.nip,
        companyName=profile.company_name,
        logo=profile.logo,
        contactEmail=profile.contact_email,
        phone=profile.phone,
        addressStreetName=profile.address_street_name,
        addressStreetNumber=profile.address_street_number,
        addressCity=profile.address_city,
        addressPostalCode=profile.address_postal_code,
        addressCountry=profile.address_country,
        latitude=float(profile.latitude) if profile.latitude is not None else None,
        longitude=float(profile.longitude) if profile.longitude is not None else None,
        geocodingStatus=profile.geocoding_status,
        locationSource=profile.location_source,
        locationPrecision=profile.location_precision,
        isLocationPublic=profile.is_location_public,
        ownerFirstName=profile.owner_first_name,
        ownerLastName=profile.owner_last_name,
        ownerEmail=profile.owner_email,
        ownerPhone=profile.owner_phone,
        contactPersonFirstName=profile.contact_person_first_name,
        contactPersonLastName=profile.contact_person_last_name,
        contactPersonEmail=profile.contact_person_email,
        contactPersonPhone=profile.contact_person_phone,
        socialFacebook=profile.social_facebook,
        socialInstagram=profile.social_instagram,
        socialTiktok=profile.social_tiktok,
        socialWebsite=profile.social_website,
        createdAt=profile.created_at,
        updatedAt=profile.updated_at,
    )
