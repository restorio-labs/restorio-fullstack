import type { TenantSummary } from "@restorio/types";
import { Button, Form, FormActions, Input, useI18n } from "@restorio/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import {
  AddressFieldset,
  CompanyFieldset,
  ContactFieldset,
  OwnerFieldset,
} from "../components/tenant-profile/TenantProfileFieldsets";
import type { ProfileFormData } from "../components/tenant-profile/profileForm";
import { tenantDetailsQueryKey, useCurrentTenant } from "../context/TenantContext";
import { tenantsQueryKey } from "../hooks/useTenants";
import { useValidationErrors } from "../hooks/useValidationErrors";
import { PageLayout } from "../layouts/PageLayout";

type CreateTenantFormValues = {
  name: string;
} & Pick<
  ProfileFormData,
  | "nip"
  | "companyName"
  | "contactEmail"
  | "phone"
  | "addressStreet"
  | "addressCity"
  | "addressPostalCode"
  | "addressCountry"
  | "ownerFirstName"
  | "ownerLastName"
>;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

interface WrappedProfileError {
  source: "profile";
  cause: unknown;
}

const isWrappedProfileError = (error: unknown): error is WrappedProfileError =>
  typeof error === "object" && error !== null && "source" in error && (error as { source?: string }).source === "profile";

export const RestaurantCreatorPage = (): ReactElement => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshTenants, setSelectedTenantId } = useCurrentTenant();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "validation" | "profileError">(
    "idle",
  );
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const { getFieldError, setFromResponse, clearErrors } = useValidationErrors();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isValid, errors },
  } = useForm<CreateTenantFormValues>({
    defaultValues: {
      name: "",
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
    },
    mode: "onChange",
    shouldUnregister: true,
  });

  const watchedName = watch("name");
  const generatedSlug = slugify(watchedName);
  const profileRegister = register as unknown as UseFormRegister<ProfileFormData>;

  const createMutation = useMutation({
    mutationFn: async (values: CreateTenantFormValues) => {
      const createdTenant = await api.tenants.create({
        name: values.name.trim(),
        slug: generatedSlug,
        status: "ACTIVE",
      });

      if (isProfileExpanded) {
        try {
          await api.tenantProfiles.save(createdTenant.id, {
            nip: values.nip.trim(),
            company_name: values.companyName.trim(),
            contact_email: values.contactEmail.trim(),
            phone: values.phone.trim(),
            address_street: values.addressStreet.trim(),
            address_city: values.addressCity.trim(),
            address_postal_code: values.addressPostalCode.trim(),
            address_country: values.addressCountry.trim() || "Polska",
            owner_first_name: values.ownerFirstName.trim(),
            owner_last_name: values.ownerLastName.trim(),
            owner_email: null,
            owner_phone: null,
            contact_person_first_name: null,
            contact_person_last_name: null,
            contact_person_email: null,
            contact_person_phone: null,
            social_facebook: null,
            social_instagram: null,
            social_tiktok: null,
            social_website: null,
          });
        } catch (profileError) {
          throw { source: "profile", cause: profileError } as WrappedProfileError;
        }
      }

      return createdTenant;
    },
    onSuccess: (createdTenant) => {
      const createdSummary: TenantSummary = {
        ...createdTenant,
        floorCanvasCount: createdTenant.floorCanvases.length,
      };

      queryClient.setQueryData<TenantSummary[]>(tenantsQueryKey, (current = []) => {
        const filtered = current.filter((tenant) => tenant.id !== createdSummary.id);

        return [createdSummary, ...filtered];
      });
      void queryClient.invalidateQueries({ queryKey: tenantDetailsQueryKey(createdTenant.id) });

      setSelectedTenantId(createdTenant.id);
      refreshTenants();
      setSubmitStatus("success");
      clearErrors();

      reset({
        name: "",
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
      });

      navigate("/", { replace: true });
    },
    onError: (error: unknown) => {
      const sourceError = isWrappedProfileError(error) ? error.cause : error;
      const validationPrefix = isWrappedProfileError(error) ? "tenantProfile.fields" : "restaurantCreator.fields";
      const isValidation = setFromResponse(sourceError, validationPrefix);

      if (isValidation) {
        setSubmitStatus("validation");

        return;
      }

      setSubmitStatus(isWrappedProfileError(error) ? "profileError" : "error");
    },
  });

  const onSubmit = (values: CreateTenantFormValues): void => {
    clearErrors();
    setSubmitStatus("idle");
    createMutation.mutate(values);
  };

  const isFormDisabled = !isValid || createMutation.isPending;
  const getCombinedFieldError = (field: string): string | undefined => {
    const serverError = getFieldError(field);
    if (serverError) {
      return serverError;
    }

    if (field === "name" && errors.name) {
      return t("restaurantCreator.fields.name.error");
    }
    if (field === "nip" && errors.nip) {
      return t("tenantProfile.fields.nip.error");
    }
    if (field === "companyName" && errors.companyName) {
      return t("tenantProfile.fields.companyName.error");
    }
    if (field === "contactEmail" && errors.contactEmail) {
      return t("tenantProfile.fields.contactEmail.error");
    }
    if (field === "phone" && errors.phone) {
      return t("tenantProfile.fields.phone.error");
    }
    if (field === "addressStreet" && errors.addressStreet) {
      return t("tenantProfile.fields.addressStreet.error");
    }
    if (field === "addressCity" && errors.addressCity) {
      return t("tenantProfile.fields.addressCity.error");
    }
    if (field === "addressPostalCode" && errors.addressPostalCode) {
      return t("tenantProfile.fields.addressPostalCode.error");
    }
    if (field === "ownerFirstName" && errors.ownerFirstName) {
      return t("tenantProfile.fields.ownerFirstName.error");
    }
    if (field === "ownerLastName" && errors.ownerLastName) {
      return t("tenantProfile.fields.ownerLastName.error");
    }

    return undefined;
  };

  const nameError = getCombinedFieldError("name");

  return (
    <PageLayout
      title={t("restaurantCreator.title")}
      description={t("restaurantCreator.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="restaurant-creator-form" disabled={isFormDisabled}>
            {createMutation.isPending ? t("restaurantCreator.actions.creating") : t("restaurantCreator.actions.create")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-lg p-6">
        <Form
          id="restaurant-creator-form"
          onSubmit={(event: FormEvent<HTMLFormElement>): void => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <Input
            label={t("restaurantCreator.fields.name.label")}
            placeholder={t("restaurantCreator.fields.name.placeholder")}
            error={nameError}
            maxLength={255}
            {...register("name", {
              required: true,
              minLength: 1,
              maxLength: 255,
              validate: (value) => slugify(value).length > 0,
            })}
          />

          <div className="rounded-xl border border-border-default bg-surface-secondary/50">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={isProfileExpanded}
              onClick={() => setIsProfileExpanded((current) => !current)}
            >
              <div>
                <div className="text-sm font-semibold text-text-primary">{t("restaurantCreator.profile.title")}</div>
                <div className="text-xs text-text-secondary">{t("restaurantCreator.profile.description")}</div>
              </div>
              <span className="text-sm text-text-secondary">
                {isProfileExpanded ? t("restaurantCreator.profile.hide") : t("restaurantCreator.profile.show")}
              </span>
            </button>

            {isProfileExpanded && (
              <div className="border-t border-border-default px-4 py-4">
                <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                  <CompanyFieldset
                    showLogoField={false}
                    getFieldError={getCombinedFieldError}
                    register={profileRegister}
                    logoFieldError={undefined}
                    t={t}
                  />
                  <ContactFieldset getFieldError={getCombinedFieldError} register={profileRegister} t={t} />
                  <AddressFieldset getFieldError={getCombinedFieldError} register={profileRegister} t={t} />
                  <OwnerFieldset getFieldError={getCombinedFieldError} register={profileRegister} t={t} />
                </div>
              </div>
            )}
          </div>

          {submitStatus === "success" && (
            <div className="rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
              {t("restaurantCreator.success")}
            </div>
          )}

          {(submitStatus === "error" || submitStatus === "validation" || submitStatus === "profileError") && (
            <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
              {submitStatus === "validation" && t("restaurantCreator.errors.validationFailed")}
              {submitStatus === "error" && t("restaurantCreator.errors.createFailed")}
              {submitStatus === "profileError" && t("restaurantCreator.errors.profileSaveFailed")}
            </div>
          )}
        </Form>
      </div>
    </PageLayout>
  );
};
