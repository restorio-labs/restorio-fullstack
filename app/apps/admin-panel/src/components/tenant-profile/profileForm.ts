import type { TenantProfile } from "@restorio/types";

export interface ProfileFormData {
  nip: string;
  companyName: string;
  contactEmail: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  contactPersonFirstName: string;
  contactPersonLastName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialWebsite: string;
}

export const EMPTY_FORM: ProfileFormData = {
  nip: "",
  companyName: "",
  contactEmail: "",
  phone: "",
  addressStreet: "",
  addressCity: "",
  addressPostalCode: "",
  addressCountry: "Polska",
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
  addressStreet: profile.addressStreet,
  addressCity: profile.addressCity,
  addressPostalCode: profile.addressPostalCode,
  addressCountry: profile.addressCountry,
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
