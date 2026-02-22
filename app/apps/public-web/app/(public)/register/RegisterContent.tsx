"use client";

import { Button, Checkbox, Form, FormActions, FormField, Input } from "@restorio/ui";
import { useMemo, useState, type ReactElement } from "react";

import { PasswordRules } from "./PasswordRules";

import { api } from "@/api/client";
import { checkPassword, isEmailValid, isPasswordValid } from "@/lib/validation";

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

  const passwordChecks = useMemo(() => checkPassword(password), [password]);
  const passwordValid = isPasswordValid(passwordChecks);

  const emailError = submitted
    ? email.trim().length === 0
      ? "Email is required"
      : !isEmailValid(email)
        ? "Enter a valid email address"
        : undefined
    : undefined;

  const passwordError = submitted
    ? password.trim().length === 0
      ? "Password is required"
      : !passwordValid
        ? "Password does not meet the requirements"
        : undefined
    : undefined;

  const confirmPasswordError = submitted
    ? confirmPassword.trim().length === 0
      ? "Confirm your password"
      : confirmPassword !== password
        ? "Passwords do not match"
        : undefined
    : undefined;

  const restaurantNameError =
    submitted && restaurantName.trim().length === 0 ? "Restaurant name is required" : undefined;
  const termsError = submitted && !acceptTerms ? "You must accept the terms and conditions" : undefined;

  const isFormValid =
    isEmailValid(email) &&
    passwordValid &&
    confirmPassword === password &&
    confirmPassword.length > 0 &&
    restaurantName.trim().length > 0 &&
    acceptTerms;

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
      setFeedbackMessage(String(response.message ?? ""));
      setSubmitted(false);
    } catch (err: unknown) {
      interface AxiosErrorData {
        response?: { data?: { message?: string; detail?: string } };
      }
      const data =
        err && typeof err === "object" && "response" in err ? (err as AxiosErrorData).response?.data : undefined;

      let apiMessage = "Unable to create account. Please try again.";

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
      <h1 className="mb-6 text-3xl font-bold">Register your account</h1>
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
          <div className="relative">
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setShowPasswordRules(true)}
              onBlur={() => setShowPasswordRules(false)}
              error={passwordError}
              required
            />
            {showPasswordRules && <PasswordRules checks={passwordChecks} />}
          </div>
        </FormField>

        <FormField>
          <Input
            label="Confirm password"
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
            label="Restaurant name"
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
            label="I accept the terms and conditions"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            error={termsError}
            required
          />
        </FormField>

        <FormActions align="stretch">
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid}>
            Register
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
