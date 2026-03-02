"use client";

import { ThemeProvider } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  return (
    <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
      {children}
    </ThemeProvider>
  );
};
