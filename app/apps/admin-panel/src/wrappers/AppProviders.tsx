import { I18nProvider, ThemeProvider, ToastProvider } from "@restorio/ui";
import {
  LANGUAGE_LOCALE_STORAGE_KEY,
  LAST_VISITED_APP_STORAGE_KEY,
  resolveLocale,
  setCrossAppValue,
  THEME_STORAGE_KEY,
} from "@restorio/utils";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { TenantProvider } from "../context/TenantContext";
import { defaultLocale, fallbackMessages, getMessages, supportedLocales } from "../i18n/messages";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const [locale, setLocale] = useState(() =>
    resolveLocale({
      supportedLocales,
      defaultLocale,
      storageKey: LANGUAGE_LOCALE_STORAGE_KEY,
    }),
  );
  const messages = useMemo(() => getMessages(locale), [locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }

    setCrossAppValue(LANGUAGE_LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    setCrossAppValue(LAST_VISITED_APP_STORAGE_KEY, "admin-panel");
  }, []);

  return (
    <I18nProvider locale={locale} setLocale={setLocale} messages={messages} fallbackMessages={fallbackMessages}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
          <ToastProvider>
            <TenantProvider>{children}</TenantProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </I18nProvider>
  );
};
