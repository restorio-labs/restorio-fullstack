"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";

export type AuthRouteStatus = "loading" | "authenticated" | "anonymous";

interface AuthRouteContextValue {
  authStatus: AuthRouteStatus;
}

const AuthRouteContext = createContext<AuthRouteContextValue | null>(null);

export interface AuthRouteProviderProps {
  children: ReactNode;
  checkAuth: () => Promise<boolean>;
}

export const AuthRouteProvider = ({ children, checkAuth }: AuthRouteProviderProps): ReactElement => {
  const [authStatus, setAuthStatus] = useState<AuthRouteStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    const run = async (): Promise<void> => {
      const authenticated = await checkAuth();

      if (!isMounted) {
        return;
      }
      setAuthStatus(authenticated ? "authenticated" : "anonymous");
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  const value: AuthRouteContextValue = { authStatus };

  return <AuthRouteContext.Provider value={value}>{children}</AuthRouteContext.Provider>;
};

export const useAuthRoute = (): AuthRouteContextValue => {
  const ctx = useContext(AuthRouteContext);

  if (ctx === null) {
    throw new Error("useAuthRoute must be used within AuthRouteProvider");
  }

  return ctx;
};
