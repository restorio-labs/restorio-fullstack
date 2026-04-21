import { useI18n } from "@restorio/ui";
import type { ChangeEvent, ReactElement, ReactNode } from "react";

import { persistMobileLocale, SUPPORTED_LOCALES, type SupportedLocale } from "../lib/i18n";

interface GuestBottomNavProps {
  ariaLabel: string;
  children: ReactNode;
}

const isSupportedLocale = (value: string): value is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

export const MobileLanguageSwitcher = (): ReactElement => {
  const { locale, setLocale, t } = useI18n();
  const safe = isSupportedLocale(locale) ? locale : "pl";

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const next = event.target.value;

    if (!isSupportedLocale(next)) {
      return;
    }

    persistMobileLocale(next);
    setLocale(next);
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <label htmlFor="mobile-app-language" className="sr-only">
        {t("language.switcherAria")}
      </label>
      <select
        id="mobile-app-language"
        value={safe}
        onChange={handleChange}
        aria-label={t("language.switcherAria")}
        className="max-w-[7.5rem] truncate rounded-md border border-border-default bg-surface-primary px-2 py-1.5 text-xs font-medium text-text-primary shadow-sm"
      >
        <option value="pl">{t("language.optionPl")}</option>
        <option value="en">{t("language.optionEn")}</option>
        <option value="es">{t("language.optionEs")}</option>
        <option value="ar">{t("language.optionAr")}</option>
      </select>
    </div>
  );
};

export const GuestBottomNav = ({ ariaLabel, children }: GuestBottomNavProps): ReactElement => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-default bg-surface-primary/95 px-4 py-3 backdrop-blur-sm"
      aria-label={ariaLabel}
    >
      <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-2">
        {children}
        <MobileLanguageSwitcher />
      </div>
    </nav>
  );
};
