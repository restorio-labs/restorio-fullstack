"use client";

import { useMemo, useState, type ReactElement } from "react";

export default function RegisterPage(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
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
  const emailInvalid = submitted && email.trim().length === 0;
  const passwordInvalid =
    submitted &&
    (password.trim().length === 0 ||
      !passwordChecks.minLength ||
      !passwordChecks.lowercase ||
      !passwordChecks.uppercase ||
      !passwordChecks.number ||
      !passwordChecks.special);
  const confirmPasswordInvalid =
    submitted && (confirmPassword.trim().length === 0 || confirmPassword !== password);
  const restaurantNameInvalid = submitted && restaurantName.trim().length === 0;
  const termsInvalid = submitted && !acceptTerms;
  const inputClassName =
    "w-full rounded-lg border bg-white px-3 py-2 text-gray-900 outline-none ring-offset-2 transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (
      !email.trim() ||
      !password.trim() ||
      !passwordChecks.minLength ||
      !passwordChecks.lowercase ||
      !passwordChecks.uppercase ||
      !passwordChecks.number ||
      !passwordChecks.special ||
      !confirmPassword.trim() ||
      confirmPassword !== password ||
      !restaurantName.trim() ||
      !acceptTerms
    ) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          restaurant_name: restaurantName,
        }),
      });

      if (!response.ok) {
        return;
      }

      setSubmitted(false);
    } catch {
      return;
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold">Register your account</h1>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
          <input
            className={`${inputClassName} ${emailInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300"}`}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <div className="relative">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
            <input
              className={`${inputClassName} ${passwordInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300"}`}
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setShowPasswordRules(true)}
              onBlur={() => setShowPasswordRules(false)}
              required
            />
          </label>
          {showPasswordRules && (
            <div className="absolute left-full top-0 ml-4 w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm">
              <div className={passwordChecks.minLength ? "text-green-600" : "text-gray-500"}>
                - At least 8 characters
              </div>
              <div className={passwordChecks.lowercase ? "text-green-600" : "text-gray-500"}>
                - 1 small letter
              </div>
              <div className={passwordChecks.uppercase ? "text-green-600" : "text-gray-500"}>
                - 1 upper letter
              </div>
              <div className={passwordChecks.number ? "text-green-600" : "text-gray-500"}>
                - 1 number
              </div>
              <div className={passwordChecks.special ? "text-green-600" : "text-gray-500"}>
                - 1 special character
              </div>
            </div>
          )}
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Confirm password</span>
          <input
            className={`${inputClassName} ${confirmPasswordInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300"}`}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Restaurant name</span>
          <input
            className={`${inputClassName} ${restaurantNameInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300"}`}
            type="text"
            name="restaurantName"
            autoComplete="organization"
            value={restaurantName}
            onChange={(event) => setRestaurantName(event.target.value)}
            required
          />
        </label>
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
          <span className={termsInvalid ? "text-red-600" : ""}>I accept the terms and conditions</span>
        </label>
        <button className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-white transition hover:bg-black" type="submit">
          Register
        </button>
      </form>
      </div>
    </div>
  );
}
