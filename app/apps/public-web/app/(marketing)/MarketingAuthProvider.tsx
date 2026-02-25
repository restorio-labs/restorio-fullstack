"use client";

import { AuthRouteProvider } from "@restorio/ui";
import { SESSION_HINT_COOKIE_NAME } from "@restorio/utils";
import type { ReactElement, ReactNode } from "react";
import { useCallback } from "react";

import { api } from "@/api/client";

interface MarketingAuthProviderProps {
  children: ReactNode;
}

export const MarketingAuthProvider = ({ children }: MarketingAuthProviderProps): ReactElement => {
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const hasSessionCookie =
      typeof document !== "undefined" &&
      document.cookie.split(";").some((entry) => entry.trim().startsWith(`${SESSION_HINT_COOKIE_NAME}=`));

    if (!hasSessionCookie) {
      return false;
    }

    try {
      await api.auth.me();

      return true;
    } catch {
      return false;
    }
  }, []);

  return <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>;
};
