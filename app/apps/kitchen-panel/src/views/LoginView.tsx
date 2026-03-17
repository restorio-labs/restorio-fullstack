import { Button, Form, FormActions, FormField, Input, Text, useI18n } from "@restorio/ui";
import { getApiErrorMessage } from "@restorio/utils";
import { useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";

const MIN_PASSWORD_LENGTH = 6;

const isEmailValid = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const LoginView = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordValid = useMemo(() => password.trim().length >= MIN_PASSWORD_LENGTH, [password]);
  const isFormValid = useMemo(() => isEmailValid(email) && passwordValid, [email, passwordValid]);

  const emailError =
    submitted && !isEmailValid(email) ? t("auth.errors.emailInvalid") : undefined;
  const passwordError =
    submitted && !passwordValid ? t("auth.errors.passwordInvalid") : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setErrorMessage("");

    if (!isFormValid || submitting) return;

    setSubmitting(true);
    try {
      const loginResponse = await api.auth.login(email.trim(), password);
      const tenantIds = (loginResponse as Record<string, unknown>).tenant_ids;

      if (Array.isArray(tenantIds) && tenantIds.length > 0) {
        navigate(`/${tenantIds[0]}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setErrorMessage(message ?? t("auth.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-background-primary px-6 py-10">
      <div className="w-full max-w-md rounded-card border border-border-default bg-surface-primary p-6 shadow-card">
        <Text as="h1" variant="h3" weight="semibold" className="mb-2">
          {t("auth.title")}
        </Text>
        <Text as="p" variant="body-sm" className="text-text-secondary mb-6">
          {t("auth.description")}
        </Text>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
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
              label={t("auth.email")}
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
              label={t("auth.password")}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={passwordError}
              required
            />
          </FormField>

          <FormActions align="stretch">
            <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid || submitting}>
              {submitting ? t("auth.submitting") : t("auth.signIn")}
            </Button>
          </FormActions>
        </Form>
      </div>
    </div>
  );
};
