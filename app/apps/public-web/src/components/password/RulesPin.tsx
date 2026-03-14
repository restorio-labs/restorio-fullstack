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
    <div className="absolute left-0 top-full mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm md:left-full md:top-0 md:mt-0 md:ml-4 md:w-56">
      <div className={checks.minLength ? "text-green-600" : "text-gray-500"}>{t("minLength")}</div>
      <div className={checks.lowercase ? "text-green-600" : "text-gray-500"}>{t("lowercase")}</div>
      <div className={checks.uppercase ? "text-green-600" : "text-gray-500"}>{t("uppercase")}</div>
      <div className={checks.number ? "text-green-600" : "text-gray-500"}>{t("number")}</div>
      <div className={checks.special ? "text-green-600" : "text-gray-500"}>{t("special")}</div>
    </div>
  );
};
