"use client";

import type { AppSlug, LoginResponse } from "@restorio/types";
import { Button, ChooseApp, Form, FormActions, FormField, Input } from "@restorio/ui";
import {
  getAppUrl,
  getEnvironmentFromEnv,
  getEnvSource,
  LAST_VISITED_APP_STORAGE_KEY,
  resolveNextEnvVar,
} from "@restorio/utils";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { api, setAccessToken } from "@/api/client";

type ViewState = "form" | "choosing_app";

const isAppSlug = (value: string): value is AppSlug => {
  const slugs: readonly AppSlug[] = ["public-web", "admin-panel", "kitchen-panel", "waiter-panel", "mobile-app"];

  return (slugs as readonly string[]).includes(value);
};

const getEnvMode = (): string => {
  const viteEnv =
    typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
  const envSource = getEnvSource(viteEnv);

  return resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ?? "development";
};

const appUrl = (envMode: string, slug: AppSlug): string => getAppUrl(getEnvironmentFromEnv(envMode), slug);

export const LoginContent = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [view, setView] = useState<ViewState>("form");
  const [envMode] = useState(getEnvMode);

  const isFormValid = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password]);

  const goToApp = (slug: AppSlug): void => {
    localStorage.setItem(LAST_VISITED_APP_STORAGE_KEY, slug);
    window.location.href = appUrl(envMode, slug);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");

    if (!isFormValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const loginResponse: LoginResponse = await api.auth.login(email.trim(), password);
      const accessToken: string = loginResponse.data.at;

      setAccessToken(accessToken);

      const rlvp = localStorage.getItem(LAST_VISITED_APP_STORAGE_KEY);

      if (typeof rlvp === "string" && isAppSlug(rlvp) && rlvp !== "public-web") {
        window.location.href = appUrl(envMode, rlvp);

        return;
      }

      const me = await api.auth.me(undefined, loginResponse.data.at);

      const role = me.accountType;

      if (role === "kitchen") {
        window.location.href = appUrl(envMode, "kitchen-panel");

        return;
      }

      if (role === "waiter") {
        window.location.href = appUrl(envMode, "waiter-panel");

        return;
      }

      setView("choosing_app");
    } catch (err: unknown) {
      interface AxiosErrorShape {
        response?: { data?: { message?: string; detail?: string } };
      }

      const data =
        err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape).response?.data : undefined;
      const msg =
        typeof data?.detail === "string" && data.detail.trim().length > 0
          ? data.detail
          : typeof data?.message === "string" && data.message.trim().length > 0
            ? data.message
            : "Login failed. Please check your email and password.";

      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "choosing_app") {
    return <ChooseApp onSelectApp={goToApp} />;
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-text-primary">Log in</h1>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-status-error-border bg-status-error-surface px-4 py-3 text-sm text-status-error-text">
          {errorMessage}
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
            required
          />
        </FormField>

        <FormActions align="stretch">
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid || submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
