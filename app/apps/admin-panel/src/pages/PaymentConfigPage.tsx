import { Button, Form, FormActions, Input } from "@restorio/ui";
import { type FormEvent, type ReactElement, useState } from "react";

import { api } from "../api/client";
import { PageLayout } from "../layouts/PageLayout";

type SubmitState = "idle" | "submitting" | "success" | "error";

export const PaymentConfigPage = (): ReactElement => {
  const [tenantId, setTenantId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [crcKey, setCrcKey] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isFormValid =
    tenantId.trim() !== "" && merchantId.trim() !== "" && apiKey.trim() !== "" && crcKey.trim() !== "";

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    try {
      await api.payments.updateP24Config(tenantId.trim(), {
        p24_merchantid: Number(merchantId),
        p24_api: apiKey.trim(),
        p24_crc: crcKey.trim(),
      });
      setSubmitState("success");
    } catch {
      setSubmitState("error");
      setErrorMessage("Failed to update P24 configuration. Please verify the Venue ID and try again.");
    }
  };

  return (
    <PageLayout title="Payment Configuration" description="Configure Przelewy24 payment provider settings">
      <div className="mx-auto max-w-lg p-6">
        <Form onSubmit={(e) => void handleSubmit(e)}>
          <Input
            label="Venue ID"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={tenantId}
            onChange={(e) => {
              setTenantId(e.target.value);

              if (submitState !== "idle") {
                setSubmitState("idle");
              }
            }}
            helperText="UUID of the venue in the database"
            required
          />

          <Input
            label="Merchant ID"
            type="number"
            placeholder="e.g. 123456"
            value={merchantId}
            onChange={(e) => {
              setMerchantId(e.target.value);

              if (submitState !== "idle") {
                setSubmitState("idle");
              }
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

              if (submitState !== "idle") {
                setSubmitState("idle");
              }
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

              if (submitState !== "idle") {
                setSubmitState("idle");
              }
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
