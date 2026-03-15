"use client";

import { Button, Checkbox, Form, FormActions, FormField, Input } from "@restorio/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";

import { api } from "@/api/client";
import { PasswordRulesPin } from "@/components/password/RulesPin";
import { getPasswordFieldsValidation } from "@/services/passwordFieldsValidation";
import { isEmailValid } from "@/services/validation";

export const RegisterContent = (): ReactElement => {
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
      interface AxiosErrorData {
        response?: { data?: { message?: string; detail?: string } };
      }
      const data =
        err && typeof err === "object" && "response" in err ? (err as AxiosErrorData).response?.data : undefined;

      let apiMessage = t("errors.generic");

      if (typeof data?.detail === "string" && data.detail.trim().length > 0) {
        apiMessage = data.detail;
      } else if (typeof data?.message === "string" && data.message.trim().length > 0) {
        apiMessage = data.message;
      }

      setFeedbackStatus("error");

      setFeedbackMessage(apiMessage);
    }
  };

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
          <Checkbox
            label={t("fields.terms")}
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            error={termsError}
            required
          />
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
