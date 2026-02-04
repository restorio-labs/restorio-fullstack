"use client";

import { useMemo, useState, type ReactElement } from "react";

import { RegisterField } from "./RegisterField";
import { PasswordRules } from "./PasswordRules";
import { registerAccount } from "@/services/register";

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
  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    }),
    [password],
  );
  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.lowercase &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordChecks.special;
  const emailInvalid = submitted && email.trim().length === 0;
  const passwordInvalid =
    submitted && (password.trim().length === 0 || !isPasswordValid);
  const confirmPasswordInvalid =
    submitted && (confirmPassword.trim().length === 0 || confirmPassword !== password);
  const restaurantNameInvalid = submitted && restaurantName.trim().length === 0;
  const termsInvalid = submitted && !acceptTerms;
  const requiredFields = [
    { isValid: email.trim().length > 0 },
    { isValid: password.trim().length > 0 && isPasswordValid },
    { isValid: confirmPassword.trim().length > 0 && confirmPassword === password },
    { isValid: restaurantName.trim().length > 0 },
    { isValid: acceptTerms },
  ];
  const isFormValid = requiredFields.every((field) => field.isValid);
  const inputClassName =
    "w-full rounded-lg border bg-white px-3 py-2 text-gray-900 outline-none ring-offset-2 transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setFeedbackStatus(null);
    setFeedbackMessage("");
    if (!isFormValid) {
      return;
    }

    const result = await registerAccount({
      email,
      password,
      restaurantName,
    });
    setFeedbackStatus(result.ok ? "success" : "error");
    setFeedbackMessage(result.message);
    if (result.ok) {
      setSubmitted(false);
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
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <RegisterField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          invalid={emailInvalid}
          inputClassName={inputClassName}
        />
        <div className="relative">
          <RegisterField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onFocus={() => setShowPasswordRules(true)}
            onBlur={() => setShowPasswordRules(false)}
            invalid={passwordInvalid}
            inputClassName={inputClassName}
          />
          {showPasswordRules && <PasswordRules checks={passwordChecks} />}
        </div>
        <RegisterField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          invalid={confirmPasswordInvalid}
          inputClassName={inputClassName}
        />
        <RegisterField
          label="Restaurant name"
          name="restaurantName"
          type="text"
          autoComplete="organization"
          value={restaurantName}
          onChange={(event) => setRestaurantName(event.target.value)}
          invalid={restaurantNameInvalid}
          inputClassName={inputClassName}
        />
        <label className="flex w-full items-start gap-3 px-3 py-2 text-sm text-gray-700">
          <input
            className={`mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/30 ${
              termsInvalid ? "ring-2 ring-red-500/30" : ""
            }`}
            type="checkbox"
            name="acceptTerms"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            required
          />
          <span className={termsInvalid ? "text-red-600" : ""}>
            I accept the terms and conditions
          </span>
        </label>
        <button
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-white transition hover:bg-black"
          type="submit"
        >
          Register
        </button>
      </form>
    </>
  );
};
