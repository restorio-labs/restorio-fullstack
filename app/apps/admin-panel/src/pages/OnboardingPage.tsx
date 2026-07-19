import type { ProfileFormData, TenantSummary } from "@restorio/types";
import { Button, Form, FormActions, Input, useI18n } from "@restorio/ui";
import { slugify } from "@restorio/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useRef, useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";

import { api } from "../api/client";
import { tenantDetailsQueryKey, useCurrentTenant } from "../context/TenantContext";
import { OnboardingFeaturePanel } from "../features/onboarding/OnboardingFeaturePanel";
import { EMPTY_FORM, hasValidCoordinates, toProfileRequest } from "../features/profile/profileForm";
import {
  AddressFieldset,
  CompanyFieldset,
  ContactFieldset,
  LocationFieldset,
  OwnerFieldset,
} from "../features/profile/TenantProfileFieldsets";
import { tenantsQueryKey } from "../hooks/useTenants";

interface OnboardingFormValues extends ProfileFormData {
  name: string;
}

const STEP_FIELDS: (keyof OnboardingFormValues)[][] = [
  ["name", "addressStreetName", "addressStreetNumber", "addressCity", "addressPostalCode", "addressCountry"],
  ["latitude", "longitude"],
  ["nip", "companyName", "contactEmail", "phone"],
  ["ownerFirstName", "ownerLastName"],
];

export const OnboardingPage = (): ReactElement => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { setSelectedTenantId, refreshTenants } = useCurrentTenant();
  const [activeStep, setActiveStep] = useState(0);
  const createdTenantRef = useRef<TenantSummary | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    defaultValues: { ...EMPTY_FORM, name: "" },
    mode: "onChange",
  });

  const values = watch();
  const profileRegister = register as unknown as UseFormRegister<ProfileFormData>;
  const generatedSlug = slugify(
    `${values.name}-${values.addressStreetName}-${values.addressStreetNumber}-${values.addressCity}`,
  );

  const createMutation = useMutation({
    mutationFn: async (formValues: OnboardingFormValues) => {
      let createdSummary = createdTenantRef.current;

      if (!createdSummary) {
        const createdTenant = await api.tenants.create({
          name: formValues.name.trim(),
          slug: slugify(
            `${formValues.name}-${formValues.addressStreetName}-${formValues.addressStreetNumber}-${formValues.addressCity}`,
          ),
          status: "active",
        });

        createdSummary = {
          ...createdTenant,
          floorCanvasCount: createdTenant.floorCanvases.length,
        };
        createdTenantRef.current = createdSummary;
      }

      await api.tenantProfiles.save(createdSummary.id, toProfileRequest(formValues));

      return createdSummary;
    },
    onSuccess: async (createdSummary) => {
      queryClient.setQueryData<TenantSummary[]>(tenantsQueryKey, (current = []) => {
        const filtered = current.filter((tenant) => tenant.id !== createdSummary.id);

        return [createdSummary, ...filtered];
      });
      void queryClient.invalidateQueries({ queryKey: tenantDetailsQueryKey(createdSummary.id) });
      setSelectedTenantId(createdSummary.id);

      try {
        await api.auth.refresh();
      } catch {
        // Tenant creation already rotates auth cookies on the backend
      }

      refreshTenants();
      window.location.replace("/");
    },
  });

  const getFieldError = (field: string): string | undefined => {
    if (field in errors) {
      return t(`tenantProfile.fields.${field}.error`);
    }

    return undefined;
  };

  const goToNextStep = async (): Promise<void> => {
    const isStepValid = await trigger(STEP_FIELDS[activeStep], { shouldFocus: true });

    if (isStepValid && activeStep < STEP_FIELDS.length - 1) {
      setActiveStep((step) => step + 1);
    }
  };

  const onSubmit = (formValues: OnboardingFormValues): void => {
    createMutation.mutate(formValues);
  };

  const isFinalStep = activeStep === STEP_FIELDS.length - 1;

  return (
    <main className="min-h-screen bg-surface-secondary p-0 onboarding-fade-in lg:p-6">
      <div className="mx-auto grid min-h-screen max-w-7xl overflow-hidden bg-surface-primary shadow-2xl lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(340px,0.9fr)_minmax(560px,1.35fr)] lg:rounded-2xl">
        <OnboardingFeaturePanel activeStep={activeStep} t={t} />

        <section className="flex min-w-0 flex-col px-5 py-7 sm:px-10 lg:px-14 lg:py-10">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-interactive-primary">
                {t(`onboarding.steps.${activeStep}.counter`)}
              </p>
              <p className="text-sm text-text-tertiary">{t("onboarding.progressLabel")}</p>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
              {STEP_FIELDS.map((_, index) => (
                <span
                  key={STEP_FIELDS[index].join("-")}
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    index <= activeStep ? "bg-interactive-primary" : "bg-surface-tertiary"
                  }`}
                />
              ))}
            </div>
          </div>

          <div key={activeStep} className="onboarding-step-enter flex-1">
            <h2 className="text-2xl font-bold text-text-primary">{t(`onboarding.steps.${activeStep}.title`)}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {t(`onboarding.steps.${activeStep}.description`)}
            </p>

            <Form
              id="onboarding-form"
              className="mt-7"
              onSubmit={(event: FormEvent<HTMLFormElement>): void => {
                void handleSubmit(onSubmit)(event);
              }}
            >
              {activeStep === 0 ? (
                <div className="space-y-6">
                  <Input
                    label={t("onboarding.fields.name.label")}
                    placeholder={t("onboarding.fields.name.placeholder")}
                    error={errors.name ? t("onboarding.fields.name.error") : undefined}
                    maxLength={255}
                    {...register("name", {
                      required: true,
                      validate: (value) => slugify(value).length > 0,
                    })}
                  />
                  <AddressFieldset getFieldError={getFieldError} register={profileRegister} t={t} />
                </div>
              ) : null}

              {activeStep === 1 ? (
                <LocationFieldset
                  canPublish={hasValidCoordinates(values.latitude, values.longitude)}
                  getFieldError={getFieldError}
                  register={profileRegister}
                  t={t}
                />
              ) : null}

              {activeStep === 2 ? (
                <div className="grid items-start gap-6 sm:grid-cols-2">
                  <CompanyFieldset
                    getFieldError={getFieldError}
                    logoFieldError={undefined}
                    register={profileRegister}
                    showLogoField={false}
                    t={t}
                  />
                  <ContactFieldset getFieldError={getFieldError} register={profileRegister} t={t} />
                </div>
              ) : null}

              {activeStep === 3 ? (
                <div className="space-y-6">
                  <OwnerFieldset getFieldError={getFieldError} register={profileRegister} t={t} />
                  <div className="rounded-xl border border-border-default bg-surface-secondary/60 p-5">
                    <p className="text-sm font-semibold text-text-primary">{t("onboarding.review.title")}</p>
                    <p className="mt-2 text-lg font-semibold text-text-primary">{values.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {values.addressStreetName} {values.addressStreetNumber}, {values.addressPostalCode}{" "}
                      {values.addressCity}
                    </p>
                    <p className="mt-3 text-xs text-text-tertiary">
                      {values.latitude}, {values.longitude}
                    </p>
                  </div>
                </div>
              ) : null}

              {createMutation.isError ? (
                <div
                  className="mt-5 rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text"
                  role="alert"
                >
                  {t("onboarding.errors.createFailed")}
                </div>
              ) : null}
            </Form>
          </div>

          <FormActions align="start" className="mt-8 justify-between border-t border-border-default pt-6">
            <Button
              type="button"
              variant="secondary"
              disabled={activeStep === 0 || createMutation.isPending}
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            >
              {t("onboarding.actions.back")}
            </Button>
            {isFinalStep ? (
              <Button type="submit" form="onboarding-form" disabled={!generatedSlug || createMutation.isPending}>
                {createMutation.isPending ? t("onboarding.actions.creating") : t("onboarding.actions.create")}
              </Button>
            ) : (
              <Button type="button" onClick={() => void goToNextStep()}>
                {t("onboarding.actions.continue")}
              </Button>
            )}
          </FormActions>
        </section>
      </div>
    </main>
  );
};
