import { I18nProvider, ThemeProvider } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { messagesByLocale, resolveInitialLocale } from "../lib/i18n";
import { createQueryClient } from "../lib/queryClient";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const [queryClient] = useState(createQueryClient);
  const [locale, setLocale] = useState(resolveInitialLocale);
  const messages = messagesByLocale[locale];

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale={locale} messages={messages} fallbackMessages={messagesByLocale.en} setLocale={setLocale}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
};
