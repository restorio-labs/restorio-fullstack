"use client";

import type { TenantSlugResponse } from "@restorio/types";
import { Button, ContentContainer, Input, Text } from "@restorio/ui";
import { getAppUrl, getEnvironmentFromEnv, getEnvSource, resolveNextEnvVar } from "@restorio/utils";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PasswordRules } from "../register/PasswordRules";

import { api } from "@/api/client";
import { checkPassword, isPasswordValid } from "@/lib/validation";

type Result = "loading" | "success" | "already_activated" | "expired" | "error" | "resend_sent" | "set_password";

export function ActivateContent(): ReactElement {
  const [result, setResult] = useState<Result>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activationId, setActivationId] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const didRun = useRef(false);

  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const passwordChecks = useMemo(() => checkPassword(password), [password]);
  const passwordValid = isPasswordValid(passwordChecks);
  const passwordError = passwordSubmitted
    ? password.trim().length === 0
      ? "Password is required"
      : !passwordValid
        ? "Password does not meet the requirements"
        : undefined
    : undefined;
  const confirmPasswordError = passwordSubmitted
    ? confirmPassword.trim().length === 0
      ? "Confirm your password"
      : confirmPassword !== password
        ? "Passwords do not match"
        : undefined
    : undefined;
  const isPasswordFormValid = passwordValid && confirmPassword === password && confirmPassword.length > 0;

  useEffect(() => {
    if (resendCooldownUntil <= 0) {
      setCooldownSeconds(0);

      return;
    }
    const tick = (): void => {
      const left = Math.ceil((resendCooldownUntil - Date.now()) / 1000);

      setCooldownSeconds(Math.max(0, left));

      if (left <= 0) {
        setResendCooldownUntil(0);
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [resendCooldownUntil]);

  useEffect(() => {
    if (didRun.current) {
      return;
    }
    didRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("activation_id")?.trim() ?? "";

    setActivationId(id);

    if (!id) {
      setErrorMessage("Activation link is missing or invalid.");
      setResult("error");

      return;
    }

    const run = async (): Promise<void> => {
      try {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call,
           @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
        const body = await api.auth.activate(id);

        const requiresPasswordChange = body.data.requires_password_change === true;

        if (requiresPasswordChange) {
          setResult("set_password");

          return;
        }

        setResult((body.message === "Account already activated" ? "already_activated" : "success") as Result);
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call,
           @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
      } catch (err: unknown) {
        interface AxiosErrorShape {
          response?: { status?: number; data?: { message?: string; detail?: string } };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;
        const status = axiosErr?.response?.status;
        const msg = axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.detail;

        if (status === 410) {
          setErrorMessage(msg ?? "Activation link has expired.");
          setResult("expired");
        } else {
          setErrorMessage(msg ?? "Activation failed. Please request a new link.");
          setResult("error");
        }
      }
    };

    void run();
  }, []);

  const handleResend = (): void => {
    if (!activationId || resendLoading) {
      return;
    }
    setResendLoading(true);

    const run = async (): Promise<void> => {
      try {
        await (api.auth.resendActivation as (id: string) => Promise<TenantSlugResponse>)(activationId);
        setResult("resend_sent");
      } catch (err: unknown) {
        interface AxiosErrorShape {
          response?: { status?: number; data?: { message?: string; detail?: string } };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;

        setErrorMessage(
          axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.detail ?? "Failed to resend activation email.",
        );

        if (axiosErr?.response?.status === 429) {
          setResendCooldownUntil(Date.now() + 300_000);
        }
      } finally {
        setResendLoading(false);
      }
    };

    void run();
  };

  const handleSetPassword = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPasswordSubmitted(true);
    setErrorMessage("");

    if (!activationId || !isPasswordFormValid) {
      return;
    }

    setIsSettingPassword(true);

    const run = async (): Promise<void> => {
      try {
        await (
          api.auth.setActivationPassword as (payload: {
            activation_id: string;
            password: string;
          }) => Promise<TenantSlugResponse>
        )({
          activation_id: activationId,
          password,
        });

        setResult("success");
      } catch (err: unknown) {
        interface AxiosErrorShape {
          response?: { status?: number; data?: { message?: string; detail?: string } };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;
        const status = axiosErr?.response?.status;
        const msg = axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.detail;

        if (status === 410) {
          setErrorMessage(msg ?? "Activation link has expired.");
          setResult("expired");
        } else {
          setErrorMessage(msg ?? "Failed to set password. Please try again.");
        }
      } finally {
        setIsSettingPassword(false);
      }
    };

    void run();
  };

  const resendOnCooldown = cooldownSeconds > 0;

  const viteEnv =
    typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
  const envSource = getEnvSource(viteEnv);
  const envMode = resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ?? "development";
  const adminPanelUrlEnv = resolveNextEnvVar(envSource, "VITE_ADMIN_PANEL_URL", "NEXT_PUBLIC_ADMIN_PANEL_URL");
  const adminPanelUrl = adminPanelUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "admin-panel");

  return (
    <div className="py-16 md:py-24">
      <ContentContainer maxWidth={result === "set_password" ? "full" : "md"} padding>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-8 text-center">
          {result === "loading" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                We are activating your account
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                This should only take a moment.
              </Text>
            </>
          )}

          {result === "success" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                Your account is activated.
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                You’re now logged in. Continue to the admin panel to finish setup.
              </Text>
              <div className="mt-8 flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    window.location.href = adminPanelUrl;
                  }}
                >
                  Go to admin panel
                </Button>
              </div>
            </>
          )}

          {result === "already_activated" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                This account is already activated.
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                Continue to the admin panel.
              </Text>
              <div className="mt-8 flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    window.location.href = adminPanelUrl;
                  }}
                >
                  Go to admin panel
                </Button>
              </div>
            </>
          )}

          {result === "expired" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                Activation link has expired
              </Text>
              <Text variant="body-lg" className="mb-6 text-text-secondary">
                {errorMessage}
              </Text>
              <Button variant="primary" onClick={handleResend} disabled={resendLoading || resendOnCooldown}>
                {resendLoading
                  ? "Sending…"
                  : resendOnCooldown
                    ? `Resend activation link (${cooldownSeconds}s)`
                    : "Resend activation link"}
              </Button>
            </>
          )}

          {result === "set_password" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                Set your password
              </Text>
              <Text variant="body-lg" className="mb-6 text-text-secondary">
                Before activation, set a password for your account.
              </Text>
              <form className="w-full space-y-4 text-left" onSubmit={handleSetPassword}>
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
                <Input
                  label="Repeat password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  error={confirmPasswordError}
                  required
                />
                {errorMessage && <p className="text-sm text-status-error-text">{errorMessage}</p>}
                <Button type="submit" variant="primary" fullWidth disabled={!isPasswordFormValid || isSettingPassword}>
                  {isSettingPassword ? "Saving..." : "Save password and activate"}
                </Button>
              </form>
            </>
          )}

          {result === "resend_sent" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                Check your email
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                We’ve sent a new activation link. Use the link in the email to activate your account.
              </Text>
            </>
          )}

          {result === "error" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                Activation failed
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                {errorMessage || "Please request a new activation link."}
              </Text>
            </>
          )}
        </div>
      </ContentContainer>
    </div>
  );
}
