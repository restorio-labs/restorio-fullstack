import { ThemeProvider } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};
