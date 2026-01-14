"use client";

import { ThemeProvider } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  return <ThemeProvider defaultMode="system">{children}</ThemeProvider>;
};
