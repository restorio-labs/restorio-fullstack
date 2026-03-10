"use client";

import { APP_SLUGS, type AppSlug } from "@restorio/types";
import { Button, ChooseApp, Form, FormActions, FormField, Input } from "@restorio/ui";
import {
  getApiErrorData,
  getApiErrorMessage,
  getApiValidationFieldLeafs,
  LAST_VISITED_APP_STORAGE_KEY,
  getAppHref,
  goToApp,
} from "@restorio/utils";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { api } from "@/api/client";
import { isEmailValid, MIN_PASSWORD_LENGTH } from "@/services/validation";

type ViewState = "form" | "choosing_app";
type LoginField = "email" | "password";
type LoginFieldErrors = Partial<Record<LoginField, string>>;

const isAppSlug = (value: string): value is AppSlug => {
  return (APP_SLUGS as readonly string[]).includes(value);
};

const extractFieldErrors = (data: unknown, t: ReturnType<typeof useTranslations>): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  const fieldLeafs = new Set(getApiValidationFieldLeafs(data));

  if (fieldLeafs.has("email")) {
    errors.email = t("login.errors.emailInvalid");
  }

  if (fieldLeafs.has("password")) {
    errors.password = t("login.errors.passwordInvalid");
  }

  return errors;
};

export const LoginContent = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [view, setView] = useState<ViewState>("form");
  const t = useTranslations();

  const passwordValid = useMemo(() => password.trim().length >= MIN_PASSWORD_LENGTH, [password]);
  const isFormValid = useMemo(() => isEmailValid(email) && passwordValid, [email, passwordValid]);

  const emailError = fieldErrors.email
    ? fieldErrors.email
    : submitted
      ? email.trim().length === 0
        ? t("login.errors.emailRequired")
        : !isEmailValid(email)
          ? t("login.errors.emailInvalid")
          : undefined
      : undefined;
  const passwordError = fieldErrors.password
    ? fieldErrors.password
    : submitted
      ? password.trim().length === 0
        ? t("login.errors.passwordRequired")
        : !passwordValid
          ? t("login.errors.passwordMinLength", { min: MIN_PASSWORD_LENGTH })
          : undefined
      : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setErrorMessage("");
    setFieldErrors({});

    if (!isFormValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await api.auth.login(email.trim(), password);

      const rlvp = localStorage.getItem(LAST_VISITED_APP_STORAGE_KEY);

      if (typeof rlvp === "string" && isAppSlug(rlvp) && rlvp !== "public-web") {
        window.location.href = getAppHref(rlvp);

        return;
      }

      const me = await api.auth.me();

      const role = me.accountType;

      if (role === "kitchen") {
        window.location.href = getAppHref("kitchen-panel");

        return;
      }

      if (role === "waiter") {
        window.location.href = getAppHref("waiter-panel");

        return;
      }

      setView("choosing_app");
    } catch (err: unknown) {
      const data = getApiErrorData(err);
      const extractedFieldErrors = extractFieldErrors(data, t);
      const hasFieldErrors = Object.keys(extractedFieldErrors).length > 0;
      const apiMessage = getApiErrorMessage(data);

      if (hasFieldErrors) {
        setFieldErrors(extractedFieldErrors);
      }

      setErrorMessage(apiMessage ?? (hasFieldErrors ? "" : t("login.genericError")));
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "choosing_app") {
    const chooseAppLabels = {
      adminPanel: t("chooseApp.labels.adminPanel"),
      kitchenPanel: t("chooseApp.labels.kitchenPanel"),
      waiterPanel: t("chooseApp.labels.waiterPanel"),
    };

    return (
      <ChooseApp
        onSelectApp={(slug) => goToApp(slug)}
        labels={chooseAppLabels}
        title={t("chooseApp.title")}
        subtitle={t("chooseApp.subtitle")}
      />
    );
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-text-primary">{t("login.title")}</h1>

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
            label={t("login.email")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={emailError}
            required
          />
        </FormField>

        <FormField>
          <Input
            label={t("login.password")}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);

              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={passwordError}
            required
          />
        </FormField>

        <FormActions align="stretch">
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid || submitting}>
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
