import { Button, Form, FormActions, Input } from "@restorio/ui";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

type SubmitState = "idle" | "submitting" | "success" | "error";

export const PaymentConfigPage = (): ReactElement => {
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
      setErrorMessage("Failed to load restaurants. Please refresh and try again.");
    }
  }, [tenantsState]);

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
      setErrorMessage("Select a restaurant from the header dropdown.");

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
      setErrorMessage("Failed to update P24 configuration. Please verify the restaurant tenant ID and try again.");
    }
  };

  return (
    <PageLayout title="Payment Configuration" description="Configure Przelewy24 payment provider settings">
      <div className="mx-auto max-w-lg p-6">
        <Form onSubmit={(e) => void handleSubmit(e)}>
          <div className="rounded-lg border border-border-default bg-surface-secondary px-4 py-3 text-sm">
            <div className="font-medium text-text-primary">Selected restaurant</div>
            <div className="mt-1 text-text-secondary">
              {selectedTenant ? `${selectedTenant.name} (${selectedTenant.id})` : "No restaurant selected."}
            </div>
          </div>
          {tenantsState === "loading" && <div className="text-xs text-text-tertiary">Loading restaurants...</div>}
          {tenantsState === "error" && (
            <div className="text-xs text-status-error-text">
              Failed to load restaurants. Please refresh and try again.
            </div>
          )}

          <Input
            label="Merchant ID"
            type="number"
            placeholder="e.g. 123456"
            value={merchantId}
            onChange={(e) => {
              setMerchantId(e.target.value);
              resetSubmitState();
            }}
            min={0}
            max={999999}
            helperText="Przelewy24 merchant identifier (max 6 digits)"
            required
          />

          <Input
            label="P24 API Key"
            placeholder="Enter Przelewy24 API key"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              resetSubmitState();
            }}
            maxLength={32}
            helperText="Max 32 characters"
            required
          />

          <Input
            label="P24 CRC Key"
            placeholder="Enter Przelewy24 CRC key"
            value={crcKey}
            onChange={(e) => {
              setCrcKey(e.target.value);
              resetSubmitState();
            }}
            maxLength={16}
            helperText="Max 16 characters"
            required
          />

          {submitState === "success" && (
            <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
              P24 configuration updated successfully.
            </div>
          )}

          {submitState === "error" && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <FormActions>
            <Button type="submit" disabled={!isFormValid || submitState === "submitting"}>
              {submitState === "submitting" ? "Saving..." : "Save Configuration"}
            </Button>
          </FormActions>
        </Form>
      </div>
    </PageLayout>
  );
};
