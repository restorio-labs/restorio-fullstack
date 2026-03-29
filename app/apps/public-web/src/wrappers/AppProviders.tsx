"use client";

import { checkAuthSession } from "@restorio/auth";
import { AuthRouteProvider, I18nProvider, ThemeProvider } from "@restorio/ui";
import { SESSION_HINT_COOKIE, THEME_STORAGE_KEY } from "@restorio/utils";
import { useMessages } from "next-intl";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { api } from "@/api/client";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const locale = "pl";
  const messages = useMessages();
  const checkAuth = useCallback(async (): Promise<boolean> => {
    return checkAuthSession(() => api.auth.me(), { requireSessionHintCookie: SESSION_HINT_COOKIE });
  }, []);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
        <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};
