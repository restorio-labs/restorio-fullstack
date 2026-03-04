import { Button, Form, FormActions, Input, useI18n } from "@restorio/ui";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { useValidationErrors } from "../hooks/useValidationErrors";
import { PageLayout } from "../layouts/PageLayout";

type SubmitState = "idle" | "loading" | "submitting" | "success" | "error" | "validation";

interface ProfileFormData {
  nip: string;
  companyName: string;
  logoUrl: string;
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

const EMPTY_FORM: ProfileFormData = {
  nip: "",
  companyName: "",
  logoUrl: "",
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

export const TenantProfilePage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenant } = useCurrentTenant();
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_FORM);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const { getFieldError, setFromResponse, clearErrors } = useValidationErrors();

  const updateField = useCallback(
    (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setSubmitState((s) => (s === "idle" || s === "loading" ? s : "idle"));
      clearErrors();
    },
    [clearErrors],
  );

  useEffect(() => {
    if (!selectedTenant) {
      setFormData(EMPTY_FORM);
      return;
    }

    let cancelled = false;
    setSubmitState("loading");

    const fetchProfile = async (): Promise<void> => {
      try {
        const profile = await api.tenantProfiles.get(selectedTenant.id);
        if (cancelled) return;

        setFormData({
          nip: profile.nip,
          companyName: profile.companyName,
          logoUrl: profile.logoUrl ?? "",
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
        setSubmitState("idle");
      } catch {
        if (!cancelled) {
          setFormData(EMPTY_FORM);
          setSubmitState("idle");
        }
      }
    };

    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [selectedTenant]);

  const isFormValid =
    (selectedTenant?.id ?? "").trim() !== "" &&
    /^\d{10}$/.test(formData.nip) &&
    formData.companyName.trim() !== "" &&
    formData.contactEmail.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.addressStreet.trim() !== "" &&
    formData.addressCity.trim() !== "" &&
    /^\d{2}-\d{3}$/.test(formData.addressPostalCode) &&
    formData.ownerFirstName.trim() !== "" &&
    formData.ownerLastName.trim() !== "";

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedTenant) {
      setSubmitState("error");
      return;
    }

    setSubmitState("submitting");

    try {
      await api.tenantProfiles.save(selectedTenant.id, {
        nip: formData.nip.trim(),
        company_name: formData.companyName.trim(),
        logo_url: formData.logoUrl.trim() || null,
        contact_email: formData.contactEmail.trim(),
        phone: formData.phone.trim(),
        address_street: formData.addressStreet.trim(),
        address_city: formData.addressCity.trim(),
        address_postal_code: formData.addressPostalCode.trim(),
        address_country: formData.addressCountry.trim() || "Polska",
        owner_first_name: formData.ownerFirstName.trim(),
        owner_last_name: formData.ownerLastName.trim(),
        owner_email: formData.ownerEmail.trim() || null,
        owner_phone: formData.ownerPhone.trim() || null,
        contact_person_first_name: formData.contactPersonFirstName.trim() || null,
        contact_person_last_name: formData.contactPersonLastName.trim() || null,
        contact_person_email: formData.contactPersonEmail.trim() || null,
        contact_person_phone: formData.contactPersonPhone.trim() || null,
        social_facebook: formData.socialFacebook.trim() || null,
        social_instagram: formData.socialInstagram.trim() || null,
        social_tiktok: formData.socialTiktok.trim() || null,
        social_website: formData.socialWebsite.trim() || null,
      });

      setSubmitState("success");
    } catch (err) {
      const isValidation = setFromResponse(err, "tenantProfile.fields");
      setSubmitState(isValidation ? "validation" : "error");
    }
  };

  return (
    <PageLayout
      title={t("tenantProfile.title")}
      description={t("tenantProfile.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="tenant-profile-form">
            {submitState === "submitting" ? t("tenantProfile.actions.saving") : t("tenantProfile.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-5xl p-6">
        <Form id="tenant-profile-form" onSubmit={(e) => void handleSubmit(e)}>
          {submitState === "loading" && (
            <div className="text-xs text-text-tertiary">{t("tenantProfile.loadingProfile")}</div>
          )}
          {submitState === "error" && (
            <div className="text-xs text-status-error-text">{t("tenantProfile.errors.saveFailed")}</div>
          )}
          {submitState === "validation" && (
            <div className="text-xs text-status-error-text">{t("tenantProfile.errors.validationFailed")}</div>
          )}

          <div className="mt-2 grid gap-6 lg:grid-cols-2">
            <fieldset className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <legend className="mb-0 text-sm font-semibold text-text-primary">
                {t("tenantProfile.sections.company")}
              </legend>
              <div className="space-y-4">
                <Input
                  label={t("tenantProfile.fields.nip.label")}
                  placeholder={t("tenantProfile.fields.nip.placeholder")}
                  value={formData.nip}
                  onChange={updateField("nip")}
                  maxLength={10}
                  helperText={t("tenantProfile.fields.nip.helper")}
                  error={getFieldError("nip")}
                  required
                />
                <Input
                  label={t("tenantProfile.fields.companyName.label")}
                  placeholder={t("tenantProfile.fields.companyName.placeholder")}
                  value={formData.companyName}
                  onChange={updateField("companyName")}
                  maxLength={255}
                  error={getFieldError("companyName")}
                  required
                />
                <Input
                  label={t("tenantProfile.fields.logoUrl.label")}
                  placeholder={t("tenantProfile.fields.logoUrl.placeholder")}
                  value={formData.logoUrl}
                  onChange={updateField("logoUrl")}
                  maxLength={512}
                  error={getFieldError("logoUrl")}
                />
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <legend className="mb-0 text-sm font-semibold text-text-primary">
                {t("tenantProfile.sections.contact")}
              </legend>
              <div className="space-y-4">
                <Input
                  label={t("tenantProfile.fields.contactEmail.label")}
                  type="email"
                  placeholder={t("tenantProfile.fields.contactEmail.placeholder")}
                  value={formData.contactEmail}
                  onChange={updateField("contactEmail")}
                  maxLength={255}
                  error={getFieldError("contactEmail")}
                  required
                />
                <Input
                  label={t("tenantProfile.fields.phone.label")}
                  type="tel"
                  placeholder={t("tenantProfile.fields.phone.placeholder")}
                  value={formData.phone}
                  onChange={updateField("phone")}
                  maxLength={20}
                  error={getFieldError("phone")}
                  required
                />
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <legend className="mb-0 text-sm font-semibold text-text-primary">
                {t("tenantProfile.sections.address")}
              </legend>
              <div className="space-y-4">
                <Input
                  label={t("tenantProfile.fields.addressStreet.label")}
                  placeholder={t("tenantProfile.fields.addressStreet.placeholder")}
                  value={formData.addressStreet}
                  onChange={updateField("addressStreet")}
                  maxLength={255}
                  error={getFieldError("addressStreet")}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.addressCity.label")}
                    placeholder={t("tenantProfile.fields.addressCity.placeholder")}
                    value={formData.addressCity}
                    onChange={updateField("addressCity")}
                    maxLength={100}
                    error={getFieldError("addressCity")}
                    required
                  />
                  <Input
                    label={t("tenantProfile.fields.addressPostalCode.label")}
                    placeholder={t("tenantProfile.fields.addressPostalCode.placeholder")}
                    value={formData.addressPostalCode}
                    onChange={updateField("addressPostalCode")}
                    maxLength={6}
                    helperText={t("tenantProfile.fields.addressPostalCode.helper")}
                    error={getFieldError("addressPostalCode")}
                    required
                  />
                </div>
                <Input
                  label={t("tenantProfile.fields.addressCountry.label")}
                  placeholder={t("tenantProfile.fields.addressCountry.placeholder")}
                  value={formData.addressCountry}
                  onChange={updateField("addressCountry")}
                  maxLength={100}
                  error={getFieldError("addressCountry")}
                />
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <legend className="mb-0 text-sm font-semibold text-text-primary">
                {t("tenantProfile.sections.owner")}
              </legend>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.ownerFirstName.label")}
                    placeholder={t("tenantProfile.fields.ownerFirstName.placeholder")}
                    value={formData.ownerFirstName}
                    onChange={updateField("ownerFirstName")}
                    maxLength={100}
                    error={getFieldError("ownerFirstName")}
                    required
                  />
                  <Input
                    label={t("tenantProfile.fields.ownerLastName.label")}
                    placeholder={t("tenantProfile.fields.ownerLastName.placeholder")}
                    value={formData.ownerLastName}
                    onChange={updateField("ownerLastName")}
                    maxLength={100}
                    error={getFieldError("ownerLastName")}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.ownerEmail.label")}
                    type="email"
                    placeholder={t("tenantProfile.fields.ownerEmail.placeholder")}
                    value={formData.ownerEmail}
                    onChange={updateField("ownerEmail")}
                    maxLength={255}
                    error={getFieldError("ownerEmail")}
                  />
                  <Input
                    label={t("tenantProfile.fields.ownerPhone.label")}
                    type="tel"
                    placeholder={t("tenantProfile.fields.ownerPhone.placeholder")}
                    value={formData.ownerPhone}
                    onChange={updateField("ownerPhone")}
                    maxLength={20}
                    error={getFieldError("ownerPhone")}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <legend className="mb-0 text-sm font-semibold text-text-primary">
                {t("tenantProfile.sections.contactPerson")}
              </legend>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.contactPersonFirstName.label")}
                    placeholder={t("tenantProfile.fields.contactPersonFirstName.placeholder")}
                    value={formData.contactPersonFirstName}
                    onChange={updateField("contactPersonFirstName")}
                    maxLength={100}
                    error={getFieldError("contactPersonFirstName")}
                  />
                  <Input
                    label={t("tenantProfile.fields.contactPersonLastName.label")}
                    placeholder={t("tenantProfile.fields.contactPersonLastName.placeholder")}
                    value={formData.contactPersonLastName}
                    onChange={updateField("contactPersonLastName")}
                    maxLength={100}
                    error={getFieldError("contactPersonLastName")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.contactPersonEmail.label")}
                    type="email"
                    placeholder={t("tenantProfile.fields.contactPersonEmail.placeholder")}
                    value={formData.contactPersonEmail}
                    onChange={updateField("contactPersonEmail")}
                    maxLength={255}
                    error={getFieldError("contactPersonEmail")}
                  />
                  <Input
                    label={t("tenantProfile.fields.contactPersonPhone.label")}
                    type="tel"
                    placeholder={t("tenantProfile.fields.contactPersonPhone.placeholder")}
                    value={formData.contactPersonPhone}
                    onChange={updateField("contactPersonPhone")}
                    maxLength={20}
                    error={getFieldError("contactPersonPhone")}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <legend className="mb-0 text-sm font-semibold text-text-primary">
                {t("tenantProfile.sections.socials")}
              </legend>
              <div className="space-y-4">
                <Input
                  label={t("tenantProfile.fields.socialFacebook.label")}
                  placeholder={t("tenantProfile.fields.socialFacebook.placeholder")}
                  value={formData.socialFacebook}
                  onChange={updateField("socialFacebook")}
                  maxLength={512}
                  error={getFieldError("socialFacebook")}
                />
                <Input
                  label={t("tenantProfile.fields.socialInstagram.label")}
                  placeholder={t("tenantProfile.fields.socialInstagram.placeholder")}
                  value={formData.socialInstagram}
                  onChange={updateField("socialInstagram")}
                  maxLength={512}
                  error={getFieldError("socialInstagram")}
                />
                <Input
                  label={t("tenantProfile.fields.socialTiktok.label")}
                  placeholder={t("tenantProfile.fields.socialTiktok.placeholder")}
                  value={formData.socialTiktok}
                  onChange={updateField("socialTiktok")}
                  maxLength={512}
                  error={getFieldError("socialTiktok")}
                />
                <Input
                  label={t("tenantProfile.fields.socialWebsite.label")}
                  placeholder={t("tenantProfile.fields.socialWebsite.placeholder")}
                  value={formData.socialWebsite}
                  onChange={updateField("socialWebsite")}
                  maxLength={512}
                  error={getFieldError("socialWebsite")}
                />
              </div>
            </fieldset>
          </div>

          {submitState === "success" && (
            <div className="rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
              {t("tenantProfile.success")}
            </div>
          )}
        </Form>
      </div>
    </PageLayout>
  );
};
