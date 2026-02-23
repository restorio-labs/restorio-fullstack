"use client";

import { UserRole } from "@restorio/types";
import { Button, Form, FormActions, FormField, Input } from "@restorio/ui";
import { getAppUrl, getEnvironmentFromEnv, resolveNextEnvVar, getEnvSource } from "@restorio/utils";
import { useState, type ReactElement } from "react";

import { api } from "@/api/client";
import { setAccessTokenCookie } from "@/lib/authCookie";
import { isEmailValid } from "@/lib/validation";

const viteEnv = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
const envSource = getEnvSource(viteEnv);
const envMode = resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ?? "development";

const roleToAppSlug: Record<UserRole, "admin-panel" | "kitchen-panel" | "waiter-panel"> = {
  [UserRole.SUPER_ADMIN]: "admin-panel",
  [UserRole.ADMIN]: "admin-panel",
  [UserRole.OWNER]: "admin-panel",
  [UserRole.MANAGER]: "admin-panel",
  [UserRole.KITCHEN_STAFF]: "kitchen-panel",
  [UserRole.WAITER]: "waiter-panel",
};

const roleFromToken = (token: string): UserRole | null => {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as { role?: string };
    const { role } = payload;

    return typeof role === "string" && Object.values(UserRole).includes(role as UserRole) ? (role as UserRole) : null;
  } catch {
    return null;
  }
};

export const LoginContent = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<"success" | "error" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const emailError = submitted
    ? email.trim().length === 0
      ? "Email is required"
      : !isEmailValid(email)
        ? "Enter a valid email address"
        : undefined
    : undefined;

  const passwordError = submitted && password.trim().length === 0 ? "Password is required" : undefined;
  const isFormValid = isEmailValid(email) && password.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setFeedbackStatus(null);
    setFeedbackMessage("");

    if (!isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.auth.login(email.trim(), password);
      const token = response.data.at;

      if (typeof token !== "string" || token.trim().length === 0) {
        throw new Error("Login token missing");
      }

      setAccessTokenCookie(token);
      const resolvedRole = roleFromToken(token) ?? UserRole.OWNER;
      const appSlug = roleToAppSlug[resolvedRole];
      const redirectUrl = getAppUrl(getEnvironmentFromEnv(envMode), appSlug);

      setFeedbackStatus("success");
      setFeedbackMessage(String(response.message ?? "Login successful"));
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      interface AxiosErrorData {
        response?: { data?: { message?: string; detail?: string } };
      }
      const data =
        err && typeof err === "object" && "response" in err ? (err as AxiosErrorData).response?.data : undefined;

      let apiMessage = "Unable to log in. Please try again.";

      if (typeof data?.detail === "string" && data.detail.trim().length > 0) {
        apiMessage = data.detail;
      } else if (typeof data?.message === "string" && data.message.trim().length > 0) {
        apiMessage = data.message;
      }

      setFeedbackStatus("error");
      setFeedbackMessage(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Login to your account</h1>
      {feedbackStatus && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            feedbackStatus === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {feedbackMessage}
        </div>
      )}
      <Form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
        spacing="md"
      >
        <FormField>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            required
          />
        </FormField>

        <FormField>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordError}
            required
          />
        </FormField>

        <FormActions align="stretch">
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
