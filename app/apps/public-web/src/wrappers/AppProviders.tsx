"use client";

import { ThemeProvider } from "@restorio/ui";
import type { ReactNode } from "react";

import { PUBLIC_WEB_THEME_STORAGE_KEY } from "@/theme/themeMode";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  return (
    <ThemeProvider defaultMode="system" storageKey={PUBLIC_WEB_THEME_STORAGE_KEY}>
      {children}
    </ThemeProvider>
  );
};
