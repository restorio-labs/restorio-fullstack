import type { TenantProfile } from "@restorio/types";
import { Button, Form, FormActions, Input, useI18n } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { useValidationErrors } from "../hooks/useValidationErrors";
import { PageLayout } from "../layouts/PageLayout";

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

const profileQueryKey = (tenantId: string): readonly string[] => ["tenant-profile", tenantId];

const toFormData = (profile: TenantProfile): ProfileFormData => ({
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

export const TenantProfilePage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenant } = useCurrentTenant();
  const queryClient = useQueryClient();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "validation">("idle");
  const { getFieldError, setFromResponse, clearErrors } = useValidationErrors();

  const tenantId = selectedTenant?.id ?? null;

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: profileQueryKey(tenantId ?? ""),
    queryFn: () => api.tenantProfiles.get(tenantId!),
    enabled: tenantId !== null,
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: EMPTY_FORM,
    mode: "onChange",
  });

  useEffect(() => {
    if (profile) {
      reset(toFormData(profile));
    } else {
      reset(EMPTY_FORM);
    }

    setSubmitStatus("idle");
    clearErrors();
  }, [profile, reset, clearErrors]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileFormData) => {
      if (!tenantId) {
        throw new Error("No tenant selected");
      }

      return api.tenantProfiles.save(tenantId, {
        nip: values.nip.trim(),
        company_name: values.companyName.trim(),
        logo_url: values.logoUrl.trim() || null,
        contact_email: values.contactEmail.trim(),
        phone: values.phone.trim(),
        address_street: values.addressStreet.trim(),
        address_city: values.addressCity.trim(),
        address_postal_code: values.addressPostalCode.trim(),
        address_country: values.addressCountry.trim() || "Polska",
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
    },
    onSuccess: () => {
      setSubmitStatus("success");

      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: profileQueryKey(tenantId) });
      }
    },
    onError: (err: unknown) => {
      const isValidation = setFromResponse(err, "tenantProfile.fields");

      setSubmitStatus(isValidation ? "validation" : "error");
    },
  });

  const onSubmit = (values: ProfileFormData): void => {
    setSubmitStatus("idle");
    clearErrors();
    saveMutation.mutate(values);
  };

  const isFormDisabled = !tenantId || !isValid || isLoadingProfile || saveMutation.isPending;

  return (
    <PageLayout
      title={t("tenantProfile.title")}
      description={t("tenantProfile.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="tenant-profile-form" disabled={isFormDisabled}>
            {saveMutation.isPending ? t("tenantProfile.actions.saving") : t("tenantProfile.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-5xl p-6">
        <Form id="tenant-profile-form" onSubmit={handleSubmit(onSubmit)}>
          {isLoadingProfile && <div className="text-xs text-text-tertiary">{t("tenantProfile.loadingProfile")}</div>}
          {submitStatus === "error" && (
            <div className="text-xs text-status-error-text">{t("tenantProfile.errors.saveFailed")}</div>
          )}
          {submitStatus === "validation" && (
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
                  maxLength={10}
                  helperText={t("tenantProfile.fields.nip.helper")}
                  error={getFieldError("nip")}
                  {...register("nip", { required: true, pattern: /^\d{10}$/ })}
                />
                <Input
                  label={t("tenantProfile.fields.companyName.label")}
                  placeholder={t("tenantProfile.fields.companyName.placeholder")}
                  maxLength={255}
                  error={getFieldError("companyName")}
                  {...register("companyName", { required: true })}
                />
                <Input
                  label={t("tenantProfile.fields.logoUrl.label")}
                  placeholder={t("tenantProfile.fields.logoUrl.placeholder")}
                  maxLength={512}
                  error={getFieldError("logoUrl")}
                  {...register("logoUrl")}
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
                  maxLength={255}
                  error={getFieldError("contactEmail")}
                  {...register("contactEmail", { required: true })}
                />
                <Input
                  label={t("tenantProfile.fields.phone.label")}
                  type="tel"
                  placeholder={t("tenantProfile.fields.phone.placeholder")}
                  maxLength={20}
                  error={getFieldError("phone")}
                  {...register("phone", { required: true })}
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
                  maxLength={255}
                  error={getFieldError("addressStreet")}
                  {...register("addressStreet", { required: true })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.addressCity.label")}
                    placeholder={t("tenantProfile.fields.addressCity.placeholder")}
                    maxLength={100}
                    error={getFieldError("addressCity")}
                    {...register("addressCity", { required: true })}
                  />
                  <Input
                    label={t("tenantProfile.fields.addressPostalCode.label")}
                    placeholder={t("tenantProfile.fields.addressPostalCode.placeholder")}
                    maxLength={6}
                    helperText={t("tenantProfile.fields.addressPostalCode.helper")}
                    error={getFieldError("addressPostalCode")}
                    {...register("addressPostalCode", { required: true, pattern: /^\d{2}-\d{3}$/ })}
                  />
                </div>
                <Input
                  label={t("tenantProfile.fields.addressCountry.label")}
                  placeholder={t("tenantProfile.fields.addressCountry.placeholder")}
                  maxLength={100}
                  error={getFieldError("addressCountry")}
                  {...register("addressCountry")}
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
                    maxLength={100}
                    error={getFieldError("ownerFirstName")}
                    {...register("ownerFirstName", { required: true })}
                  />
                  <Input
                    label={t("tenantProfile.fields.ownerLastName.label")}
                    placeholder={t("tenantProfile.fields.ownerLastName.placeholder")}
                    maxLength={100}
                    error={getFieldError("ownerLastName")}
                    {...register("ownerLastName", { required: true })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.ownerEmail.label")}
                    type="email"
                    placeholder={t("tenantProfile.fields.ownerEmail.placeholder")}
                    maxLength={255}
                    error={getFieldError("ownerEmail")}
                    {...register("ownerEmail")}
                  />
                  <Input
                    label={t("tenantProfile.fields.ownerPhone.label")}
                    type="tel"
                    placeholder={t("tenantProfile.fields.ownerPhone.placeholder")}
                    maxLength={20}
                    error={getFieldError("ownerPhone")}
                    {...register("ownerPhone")}
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
                    maxLength={100}
                    error={getFieldError("contactPersonFirstName")}
                    {...register("contactPersonFirstName")}
                  />
                  <Input
                    label={t("tenantProfile.fields.contactPersonLastName.label")}
                    placeholder={t("tenantProfile.fields.contactPersonLastName.placeholder")}
                    maxLength={100}
                    error={getFieldError("contactPersonLastName")}
                    {...register("contactPersonLastName")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("tenantProfile.fields.contactPersonEmail.label")}
                    type="email"
                    placeholder={t("tenantProfile.fields.contactPersonEmail.placeholder")}
                    maxLength={255}
                    error={getFieldError("contactPersonEmail")}
                    {...register("contactPersonEmail")}
                  />
                  <Input
                    label={t("tenantProfile.fields.contactPersonPhone.label")}
                    type="tel"
                    placeholder={t("tenantProfile.fields.contactPersonPhone.placeholder")}
                    maxLength={20}
                    error={getFieldError("contactPersonPhone")}
                    {...register("contactPersonPhone")}
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
                  maxLength={512}
                  error={getFieldError("socialFacebook")}
                  {...register("socialFacebook")}
                />
                <Input
                  label={t("tenantProfile.fields.socialInstagram.label")}
                  placeholder={t("tenantProfile.fields.socialInstagram.placeholder")}
                  maxLength={512}
                  error={getFieldError("socialInstagram")}
                  {...register("socialInstagram")}
                />
                <Input
                  label={t("tenantProfile.fields.socialTiktok.label")}
                  placeholder={t("tenantProfile.fields.socialTiktok.placeholder")}
                  maxLength={512}
                  error={getFieldError("socialTiktok")}
                  {...register("socialTiktok")}
                />
                <Input
                  label={t("tenantProfile.fields.socialWebsite.label")}
                  placeholder={t("tenantProfile.fields.socialWebsite.placeholder")}
                  maxLength={512}
                  error={getFieldError("socialWebsite")}
                  {...register("socialWebsite")}
                />
              </div>
            </fieldset>
          </div>

          {submitStatus === "success" && (
            <div className="rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
              {t("tenantProfile.success")}
            </div>
          )}
        </Form>
      </div>
    </PageLayout>
  );
};
