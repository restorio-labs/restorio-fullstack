"use client";

import { Button, Form, FormActions, FormField, Input, useAuthRoute } from "@restorio/ui";
import { getApiErrorData, getApiErrorMessage } from "@restorio/utils";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactElement } from "react";

import { api } from "@/api/client";
import { AuthenticatedAppPicker } from "@/components/auth/AuthenticatedAppPicker";
import { PasswordRulesPin } from "@/components/password/RulesPin";
import { translateRegisterApiMessage } from "@/services/authApiMessages";
import { getPasswordFieldsValidation } from "@/services/passwordFieldsValidation";
import { MIN_PASSWORD_LENGTH, isEmailValid } from "@/services/validation";

export const RegisterContent = (): ReactElement => {
  const { authStatus } = useAuthRoute();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<"success" | "error" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const t = useTranslations("register");

  const checkboxId = useId();
  const errorId = `${checkboxId}-error`;

  const linkedTermsText: ReactElement = (
    <>
      {t("fields.accept")}{" "}
      <Link href="/privacy" target="_blank" className="text-text-primary underline underline-offset-2 hover:underline">
        {t("fields.statute")}
      </Link>{" "}
      {t("fields.and")}{" "}
      <Link href="/terms" target="_blank" className="text-text-primary underline underline-offset-2 hover:underline">
        {t("fields.terms")}
      </Link>{" "}
      {t("fields.ofService")}
    </>
  );

  const { passwordChecks, passwordValid, isPasswordFormValid } = getPasswordFieldsValidation(
    password,
    confirmPassword,
    submitted,
  );

  const emailError = submitted
    ? email.trim().length === 0
      ? t("errors.emailRequired")
      : !isEmailValid(email)
        ? t("errors.emailInvalid")
        : undefined
    : undefined;

  const passwordError = submitted
    ? password.trim().length === 0
      ? t("errors.passwordRequired")
      : !passwordValid
        ? t("errors.passwordInvalid")
        : undefined
    : undefined;

  const confirmPasswordError = submitted
    ? confirmPassword.trim().length === 0
      ? t("errors.confirmPasswordRequired")
      : confirmPassword !== password
        ? t("errors.confirmPasswordMismatch")
        : undefined
    : undefined;

  const restaurantNameError =
    submitted && restaurantName.trim().length === 0 ? t("errors.restaurantNameRequired") : undefined;
  const termsError = submitted && !acceptTerms ? t("errors.termsRequired") : undefined;

  const isFormValid = isEmailValid(email) && isPasswordFormValid && restaurantName.trim().length > 0 && acceptTerms;

  const confirmPasswordMeetsLength = confirmPassword.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatchByLength = confirmPasswordMeetsLength && confirmPassword === password;

  const passwordInputStatusClassName =
    !passwordError && passwordsMatchByLength
      ? "border-status-success-border focus:ring-status-success-border focus:border-status-success-border"
      : undefined;

  const confirmPasswordInputStatusClassName =
    !confirmPasswordError && passwordsMatchByLength
      ? "border-status-success-border focus:ring-status-success-border focus:border-status-success-border"
      : !confirmPasswordError && confirmPasswordMeetsLength && confirmPassword !== password
        ? "border-status-error-border focus:ring-status-error-border focus:border-status-error-border"
        : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setFeedbackStatus(null);
    setFeedbackMessage("");

    if (!isFormValid) {
      return;
    }

    try {
      const response = await api.auth.register({
        email: email.trim(),
        password,
        restaurant_name: restaurantName.trim(),
      });

      setFeedbackStatus("success");
      setFeedbackMessage(String(response.message));
      setSubmitted(false);
    } catch (err: unknown) {
      const data = getApiErrorData(err);
      const rawMessage = getApiErrorMessage(data);
      const apiMessage = translateRegisterApiMessage(rawMessage, t) ?? t("errors.generic");

      setFeedbackStatus("error");

      setFeedbackMessage(apiMessage);
    }
  };

  if (authStatus === "loading") {
    return <p className="text-center text-text-secondary">{t("common.loading")}</p>;
  }

  if (authStatus === "authenticated") {
    return <AuthenticatedAppPicker />;
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>
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
            label={t("fields.email")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            required
          />
        </FormField>

        <FormField>
          <div className="relative">
            <Input
              label={t("fields.password")}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setShowPasswordRules(true)}
              onBlur={() => setShowPasswordRules(false)}
              error={passwordError}
              className={passwordInputStatusClassName}
              required
            />
            {showPasswordRules && <PasswordRulesPin checks={passwordChecks} />}
          </div>
        </FormField>

        <FormField>
          <Input
            label={t("fields.confirmPassword")}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={confirmPasswordError}
            className={confirmPasswordInputStatusClassName}
            required
          />
        </FormField>

        <FormField>
          <Input
            label={t("fields.restaurantName")}
            type="text"
            autoComplete="organization"
            value={restaurantName}
            onChange={(event) => setRestaurantName(event.target.value)}
            error={restaurantNameError}
            required
          />
        </FormField>

        <FormField>
          <div className="w-full">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id={checkboxId}
                className={`mt-0.5 w-4 h-4 text-interactive-primary bg-surface-primary border-border-default rounded-sm focus:ring-2 focus:ring-border-focus focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                  termsError ? "border-status-error-border" : ""
                }`}
                aria-invalid={termsError ? "true" : undefined}
                aria-describedby={termsError ? errorId : undefined}
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                required
              />
              <label htmlFor={checkboxId} className="text-sm font-medium text-text-primary cursor-pointer">
                {linkedTermsText}
              </label>
            </div>
            {termsError && (
              <span id={errorId} className="block mt-1 text-sm text-status-error-text" role="alert">
                {termsError}
              </span>
            )}
          </div>
        </FormField>

        <FormActions align="stretch">
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid}>
            {t("button")}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
