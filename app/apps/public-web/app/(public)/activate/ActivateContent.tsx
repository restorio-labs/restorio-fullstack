"use client";

import { Button, ContentContainer, Text } from "@restorio/ui";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

type Result = "loading" | "success" | "already_activated" | "expired" | "error" | "resend_sent";

export function ActivateContent(): ReactElement {
  const [result, setResult] = useState<Result>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [activationId, setActivationId] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const didRun = useRef(false);

  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (resendCooldownUntil <= 0) {
      setCooldownSeconds(0);
      return;
    }
    const tick = (): void => {
      const left = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
      setCooldownSeconds(Math.max(0, left));
      if (left <= 0) setResendCooldownUntil(0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resendCooldownUntil]);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("activation_id")?.trim() ?? "";
    setActivationId(id);

    if (!id) {
      setErrorMessage("Activation link is missing or invalid.");
      setResult("error");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(
      `${apiBaseUrl}/api/v1/auth/activate?activation_id=${encodeURIComponent(id)}`,
      { method: "POST" }
    )
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
          message?: string;
          tenant_slug?: string;
        } | null;
        if (!res.ok) {
          if (res.status === 410) {
            setErrorMessage(data?.detail ?? "Activation link has expired.");
            setResult("expired");
          } else {
            setErrorMessage(data?.detail ?? "Activation failed. Please request a new link.");
            setResult("error");
          }
          return;
        }
        setTenantSlug(data?.tenant_slug ?? "");
        setResult(
          data?.message === "Account already activated" ? "already_activated" : "success"
        );
      })
      .catch(() => {
        setErrorMessage("Activation failed. Please try again later.");
        setResult("error");
      });
  }, []);

  const handleResend = (): void => {
    if (!activationId || resendLoading) return;
    setResendLoading(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(
      `${apiBaseUrl}/api/v1/auth/resend-activation?activation_id=${encodeURIComponent(activationId)}`,
      { method: "POST" }
    )
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { detail?: string } | null;
        if (!res.ok) {
          setErrorMessage(data?.detail ?? "Failed to resend activation email.");
          if (res.status === 429) {
            setResendCooldownUntil(Date.now() + 300_000);
          }
          setResendLoading(false);
          return;
        }
        setResult("resend_sent");
        setResendLoading(false);
      })
      .catch(() => {
        setErrorMessage("Failed to resend. Please try again later.");
        setResendLoading(false);
      });
  };

  const resendOnCooldown = cooldownSeconds > 0;

  const loginUrl = tenantSlug ? `https://${tenantSlug}.restorio.com/login` : "";

  return (
    <div className="py-16 md:py-24">
      <ContentContainer maxWidth="md" padding>
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
                Your account has been created.
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                You can login on{" "}
                {loginUrl ? (
                  <a href={loginUrl} className="text-interactive-primary underline">
                    {tenantSlug}.restorio.com/login
                  </a>
                ) : (
                  "{tenant_slug}.restorio.com/login"
                )}
              </Text>
            </>
          )}

          {result === "already_activated" && (
            <>
              <Text variant="h2" weight="bold" className="mb-4">
                This account is already activated.
              </Text>
              <Text variant="body-lg" className="text-text-secondary">
                You can login on{" "}
                {loginUrl ? (
                  <a href={loginUrl} className="text-interactive-primary underline">
                    {tenantSlug}.restorio.com/login
                  </a>
                ) : (
                  "{tenant_slug}.restorio.com/login"
                )}
              </Text>
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
              <Button
                variant="primary"
                onClick={handleResend}
                disabled={resendLoading || resendOnCooldown}
              >
                {resendLoading
                  ? "Sending…"
                  : resendOnCooldown
                    ? `Resend activation link (${cooldownSeconds}s)`
                    : "Resend activation link"}
              </Button>
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
