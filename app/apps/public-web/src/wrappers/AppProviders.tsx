"use client";

import { I18nProvider, ThemeProvider } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import { useLocale, useMessages } from "next-intl";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const locale = useLocale();
  const messages = useMessages();

  return (
    <I18nProvider locale={locale} messages={messages}>
      <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
        {children}
      </ThemeProvider>
    </I18nProvider>
  );
};
