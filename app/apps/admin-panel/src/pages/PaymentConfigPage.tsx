import { Button, Form, FormActions, Input, useI18n } from "@restorio/ui";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

type SubmitState = "idle" | "submitting" | "success" | "error";

export const PaymentConfigPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId, selectedTenant, tenantsState } = useCurrentTenant();
  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [crcKey, setCrcKey] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isFormValid =
    (selectedTenantId ?? "").trim() !== "" && merchantId.trim() !== "" && apiKey.trim() !== "" && crcKey.trim() !== "";

  useEffect(() => {
    if (tenantsState === "error") {
      setErrorMessage(t("payment.errors.loadRestaurants"));
    }
  }, [t, tenantsState]);

  useEffect(() => {
    setSubmitState((currentState) => (currentState === "idle" ? currentState : "idle"));
  }, [selectedTenantId]);

  const resetSubmitState = (): void => {
    if (submitState !== "idle") {
      setSubmitState("idle");
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedTenantId) {
      setSubmitState("error");
      setErrorMessage(t("payment.errors.selectRestaurant"));

      return;
    }

    setSubmitState("submitting");
    setErrorMessage("");

    try {
      await api.payments.updateP24Config(selectedTenantId.trim(), {
        p24_merchantid: Number(merchantId),
        p24_api: apiKey.trim(),
        p24_crc: crcKey.trim(),
      });

      setSubmitState("success");
    } catch {
      setSubmitState("error");
      setErrorMessage(t("payment.errors.updateFailed"));
    }
  };

  return (
    <PageLayout title={t("payment.title")} description={t("payment.description")}>
      <div className="mx-auto max-w-lg p-6">
        <Form onSubmit={(e) => void handleSubmit(e)}>
          <div className="rounded-lg border border-border-default bg-surface-secondary px-4 py-3 text-sm">
            <div className="font-medium text-text-primary">{t("payment.selectedRestaurant.title")}</div>
            <div className="mt-1 text-text-secondary">
              {selectedTenant
                ? `${selectedTenant.name} (${selectedTenant.id})`
                : t("payment.selectedRestaurant.empty")}
            </div>
          </div>
          {tenantsState === "loading" && (
            <div className="text-xs text-text-tertiary">{t("payment.loadingRestaurants")}</div>
          )}
          {tenantsState === "error" && (
            <div className="text-xs text-status-error-text">
              {t("payment.errors.loadRestaurants")}
            </div>
          )}

          <Input
            label={t("payment.fields.merchantId.label")}
            type="number"
            placeholder={t("payment.fields.merchantId.placeholder")}
            value={merchantId}
            onChange={(e) => {
              setMerchantId(e.target.value);
              resetSubmitState();
            }}
            min={0}
            max={999999}
            helperText={t("payment.fields.merchantId.helper")}
            required
          />

          <Input
            label={t("payment.fields.apiKey.label")}
            placeholder={t("payment.fields.apiKey.placeholder")}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              resetSubmitState();
            }}
            maxLength={32}
            helperText={t("payment.fields.apiKey.helper")}
            required
          />

          <Input
            label={t("payment.fields.crcKey.label")}
            placeholder={t("payment.fields.crcKey.placeholder")}
            value={crcKey}
            onChange={(e) => {
              setCrcKey(e.target.value);
              resetSubmitState();
            }}
            maxLength={16}
            helperText={t("payment.fields.crcKey.helper")}
            required
          />

          {submitState === "success" && (
            <div className="rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
              {t("payment.success")}
            </div>
          )}

          {submitState === "error" && (
            <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
              {errorMessage}
            </div>
          )}

          <FormActions>
            <Button type="submit" disabled={!isFormValid || submitState === "submitting"}>
              {submitState === "submitting" ? t("payment.actions.saving") : t("payment.actions.save")}
            </Button>
          </FormActions>
        </Form>
      </div>
    </PageLayout>
  );
};
