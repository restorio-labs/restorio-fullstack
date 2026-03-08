import { ThemeProvider } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { createQueryClient } from "../lib/queryClient";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
