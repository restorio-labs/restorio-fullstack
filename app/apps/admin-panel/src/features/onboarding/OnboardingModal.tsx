import type { TenantSummary } from "@restorio/types";
import { Button, Form, FormActions, Input, Modal, useI18n } from "@restorio/ui";
import { slugify } from "@restorio/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useForm } from "react-hook-form";

import { api } from "../../api/client";
import { tenantDetailsQueryKey, useCurrentTenant } from "../../context/TenantContext";
import { tenantsQueryKey } from "../../hooks/useTenants";

interface OnboardingFormValues {
  name: string;
  addressStreetName: string;
  addressStreetNumber: string;
  addressCity: string;
}

export const OnboardingModal = (): ReactElement => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { setSelectedTenantId, refreshTenants } = useCurrentTenant();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors },
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      name: "",
      addressStreetName: "",
      addressStreetNumber: "",
      addressCity: "",
    },
    mode: "onChange",
  });

  const watchedName = watch("name");
  const watchedStreet = watch("addressStreetName");
  const watchedNumber = watch("addressStreetNumber");
  const watchedCity = watch("addressCity");
  const generatedSlug = slugify(`${watchedName}-${watchedStreet}-${watchedNumber}-${watchedCity}`);

  const createMutation = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      const createdTenant = await api.tenants.create({
        name: values.name.trim(),
        slug: generatedSlug,
        status: "active",
      });

      return createdTenant;
    },
    onSuccess: async (createdTenant) => {
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

      try {
        await api.auth.refresh();
      } catch {
        // Token refresh may fail if cookies aren't set yet; continue regardless
      }

      refreshTenants();
    },
  });

  const onSubmit = (values: OnboardingFormValues): void => {
    createMutation.mutate(values);
  };

  const isFormDisabled = !isValid || !generatedSlug || createMutation.isPending;

  return (
    <Modal
      isOpen
      onClose={() => {
        // Modal cannot be closed during onboarding
      }}
      title={t("onboarding.title")}
      size="md"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      hideCloseButton
    >
      <p className="mb-6 text-sm text-text-secondary">{t("onboarding.description")}</p>
      <Form
        id="onboarding-form"
        onSubmit={(event: FormEvent<HTMLFormElement>): void => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <Input
          label={t("onboarding.fields.name.label")}
          placeholder={t("onboarding.fields.name.placeholder")}
          error={errors.name ? t("onboarding.fields.name.error") : undefined}
          maxLength={255}
          {...register("name", {
            required: true,
            minLength: 1,
            maxLength: 255,
            validate: (value) => slugify(value).length > 0,
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label={t("onboarding.fields.street.label")}
            placeholder={t("onboarding.fields.street.placeholder")}
            maxLength={255}
            error={errors.addressStreetName ? t("onboarding.fields.street.error") : undefined}
            {...register("addressStreetName", { required: true })}
          />
          <Input
            label={t("onboarding.fields.streetNumber.label")}
            placeholder={t("onboarding.fields.streetNumber.placeholder")}
            maxLength={20}
            error={errors.addressStreetNumber ? t("onboarding.fields.streetNumber.error") : undefined}
            {...register("addressStreetNumber", { required: true })}
          />
          <Input
            label={t("onboarding.fields.city.label")}
            placeholder={t("onboarding.fields.city.placeholder")}
            maxLength={100}
            error={errors.addressCity ? t("onboarding.fields.city.error") : undefined}
            {...register("addressCity", { required: true })}
          />
        </div>

        {createMutation.isError && (
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {t("onboarding.errors.createFailed")}
          </div>
        )}

        <FormActions align="stretch">
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={isFormDisabled}>
            {createMutation.isPending ? t("onboarding.actions.creating") : t("onboarding.actions.create")}
          </Button>
        </FormActions>
      </Form>
    </Modal>
  );
};
