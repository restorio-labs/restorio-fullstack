import type { CreateTenantProfileRequest, ProfileFormData, TenantProfile } from "@restorio/types";

export const EMPTY_FORM: ProfileFormData = {
  nip: "",
  companyName: "",
  contactEmail: "",
  phone: "",
  addressStreetName: "",
  addressStreetNumber: "",
  addressCity: "",
  addressPostalCode: "",
  addressCountry: "Polska",
  latitude: "",
  longitude: "",
  isLocationPublic: false,
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPhone: "",
  contactPersonFirstName: "",
  contactPersonLastName: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  socialFacebook: "",
  socialInstagram: "",
  socialTiktok: "",
  socialWebsite: "",
};

export const toFormData = (profile: TenantProfile): ProfileFormData => ({
  nip: profile.nip,
  companyName: profile.companyName,
  contactEmail: profile.contactEmail,
  phone: profile.phone,
  addressStreetName: profile.addressStreetName,
  addressStreetNumber: profile.addressStreetNumber,
  addressCity: profile.addressCity,
  addressPostalCode: profile.addressPostalCode,
  addressCountry: profile.addressCountry,
  latitude: profile.latitude?.toString() ?? "",
  longitude: profile.longitude?.toString() ?? "",
  isLocationPublic: profile.isLocationPublic && profile.latitude !== null && profile.longitude !== null,
  ownerFirstName: profile.ownerFirstName,
  ownerLastName: profile.ownerLastName,
  ownerEmail: profile.ownerEmail ?? "",
  ownerPhone: profile.ownerPhone ?? "",
  contactPersonFirstName: profile.contactPersonFirstName ?? "",
  contactPersonLastName: profile.contactPersonLastName ?? "",
  contactPersonEmail: profile.contactPersonEmail ?? "",
  contactPersonPhone: profile.contactPersonPhone ?? "",
  socialFacebook: profile.socialFacebook ?? "",
  socialInstagram: profile.socialInstagram ?? "",
  socialTiktok: profile.socialTiktok ?? "",
  socialWebsite: profile.socialWebsite ?? "",
});

export const hasValidCoordinates = (latitude?: string, longitude?: string): boolean => {
  if (!latitude || !longitude || latitude.trim() === "" || longitude.trim() === "") {
    return false;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  return (
    Number.isFinite(parsedLatitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    Number.isFinite(parsedLongitude) &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180
  );
};

export const toProfileRequest = (values: ProfileFormData): CreateTenantProfileRequest => ({
  nip: values.nip.trim(),
  company_name: values.companyName.trim(),
  contact_email: values.contactEmail.trim(),
  phone: values.phone.trim(),
  address_street_name: values.addressStreetName.trim(),
  address_street_number: values.addressStreetNumber.trim(),
  address_city: values.addressCity.trim(),
  address_postal_code: values.addressPostalCode.trim(),
  address_country: values.addressCountry.trim() || "Polska",
  latitude: Number(values.latitude),
  longitude: Number(values.longitude),
  geocoding_status: "not_geocoded",
  location_source: "manual",
  location_precision: "approximate",
  is_location_public: values.isLocationPublic,
  owner_first_name: values.ownerFirstName.trim(),
  owner_last_name: values.ownerLastName.trim(),
  owner_email: values.ownerEmail.trim() || null,
  owner_phone: values.ownerPhone.trim() || null,
  contact_person_first_name: values.contactPersonFirstName.trim() || null,
  contact_person_last_name: values.contactPersonLastName.trim() || null,
  contact_person_email: values.contactPersonEmail.trim() || null,
  contact_person_phone: values.contactPersonPhone.trim() || null,
  social_facebook: values.socialFacebook.trim() || null,
  social_instagram: values.socialInstagram.trim() || null,
  social_tiktok: values.socialTiktok.trim() || null,
  social_website: values.socialWebsite.trim() || null,
});
