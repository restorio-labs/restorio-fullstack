"use client";

import { checkAuthSession } from "@restorio/auth";
import { AuthRouteProvider } from "@restorio/ui";
import { SESSION_HINT_COOKIE } from "@restorio/utils";
import type { ReactElement, ReactNode } from "react";
import { useCallback } from "react";

import { api } from "@/api/client";

interface MarketingAuthProviderProps {
  children: ReactNode;
}

export const MarketingAuthProvider = ({ children }: MarketingAuthProviderProps): ReactElement => {
  const checkAuth = useCallback(async (): Promise<boolean> => {
    return checkAuthSession(() => api.auth.me(), { requireSessionHintCookie: SESSION_HINT_COOKIE });
  }, []);

  return <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>;
};
