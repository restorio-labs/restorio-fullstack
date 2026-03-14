import { Text, Input, Button } from "@restorio/ui";
import { useTranslations } from "next-intl";
import type { FormEvent, ReactElement } from "react";

import { PasswordRulesPin } from "@/components/password/RulesPin";
import type { PasswordChecks } from "@/services/validation";

interface ActivateSetPasswordViewProps {
  password: string;
  confirmPassword: string;
  passwordChecks: PasswordChecks;
  passwordError?: string;
  confirmPasswordError?: string;
  showPasswordRules: boolean;
  errorMessage: string;
  isPasswordFormValid: boolean;
  isSettingPassword: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordFocus: () => void;
  onPasswordBlur: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const ActivateSetPasswordView = ({
  password,
  confirmPassword,
  passwordChecks,
  passwordError,
  confirmPasswordError,
  showPasswordRules,
  errorMessage,
  isPasswordFormValid,
  isSettingPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onPasswordFocus,
  onPasswordBlur,
  onSubmit,
}: ActivateSetPasswordViewProps): ReactElement => {
  const t = useTranslations("activate");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("setPassword.title")}
      </Text>
      <Text variant="body-lg" className="mb-6 text-text-secondary">
        {t("setPassword.description")}
      </Text>
      <form className="w-full space-y-4 text-left" onSubmit={onSubmit}>
        <div className="relative">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            error={passwordError}
            required
          />
          {showPasswordRules && <PasswordRulesPin checks={passwordChecks} />}
        </div>
        <Input
          label="Repeat password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          error={confirmPasswordError}
          required
        />
        {errorMessage && <p className="text-sm text-status-error-text">{errorMessage}</p>}
        <Button type="submit" variant="primary" fullWidth disabled={!isPasswordFormValid || isSettingPassword}>
          {isSettingPassword ? t("setPassword.submitting") : t("setPassword.submit")}
        </Button>
      </form>
    </>
  );
};
