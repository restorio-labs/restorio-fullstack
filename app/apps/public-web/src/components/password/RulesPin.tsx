import { useTranslations } from "next-intl";
import React from "react";
import type { ReactElement } from "react";

interface PasswordRulesPinProps {
  checks: {
    minLength: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const PasswordRulesPin = ({ checks }: PasswordRulesPinProps): ReactElement => {
  const t = useTranslations("register.passwordRules");

  return (
    <div className="absolute left-0 top-full mt-2 w-full rounded-lg border border-border-default bg-surface-secondary px-3 py-2 text-xs text-text-secondary shadow-md md:left-full md:top-0 md:mt-0 md:ml-4 md:w-56">
      <div className={checks.minLength ? "text-status-success-text" : "text-text-tertiary"}>{t("minLength")}</div>
      <div className={checks.lowercase ? "text-status-success-text" : "text-text-tertiary"}>{t("lowercase")}</div>
      <div className={checks.uppercase ? "text-status-success-text" : "text-text-tertiary"}>{t("uppercase")}</div>
      <div className={checks.number ? "text-status-success-text" : "text-text-tertiary"}>{t("number")}</div>
      <div className={checks.special ? "text-status-success-text" : "text-text-tertiary"}>{t("special")}</div>
    </div>
  );
};
