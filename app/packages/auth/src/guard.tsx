import type { RefreshResponse } from "@restorio/types";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { TokenStorage } from "./storage";

export type AuthStrategy = "code" | "none";

interface AuthClient {
  auth: {
    me: () => Promise<unknown>;
    refresh: () => Promise<RefreshResponse>;
  };
}

export interface AuthGuardProps {
  strategy?: AuthStrategy;
  children: ReactNode;
  loginPath?: string;
  redirectTo?: string;
  fallback?: ReactNode;
  checkAuth?: () => boolean | Promise<boolean>;
  revalidateIntervalMs?: number;
  revalidateOnFocus?: boolean;
  client?: AuthClient;
}

type AuthStatus = "pending" | "allowed" | "unauthorized";

const fallbackTokenCheck = (): boolean => {
  const accessToken = TokenStorage.getAccessToken();

  if (accessToken && TokenStorage.isAccessTokenValid(accessToken)) {
    return true;
  }

  const refreshToken = TokenStorage.getRefreshToken();

  return Boolean(refreshToken);
};

const REVALIDATION_COOLDOWN_MS = 2000;

const createDefaultCheckAuth = (client: AuthClient | undefined): (() => boolean | Promise<boolean>) => {
  if (typeof window === "undefined" || !client) {
    return (): boolean => fallbackTokenCheck();
  }

  return async (): Promise<boolean> => {
    if (fallbackTokenCheck()) {
      return true;
    }

    try {
      await client.auth.me();

      return true;
    } catch {
      try {
        await client.auth.refresh();

        return true;
      } catch {
        return false;
      }
    }
  };
};

export const AuthGuard = ({
  strategy = "code",
  children,
  loginPath = "/login",
  redirectTo,
  fallback = null,
  checkAuth,
  client,
  revalidateIntervalMs,
  revalidateOnFocus = true,
}: AuthGuardProps): ReactElement | null => {
  const [status, setStatus] = useState<AuthStatus>(strategy === "none" ? "allowed" : "pending");

  const redirectTarget = redirectTo ?? loginPath;
  const shouldPoll = useMemo(() => Boolean(revalidateIntervalMs && revalidateIntervalMs > 0), [revalidateIntervalMs]);
  const shouldRevalidateOnFocus = useMemo(() => Boolean(revalidateOnFocus), [revalidateOnFocus]);
  const effectiveCheckAuth = useMemo(() => checkAuth ?? createDefaultCheckAuth(client), [checkAuth, client]);

  useEffect(() => {
    if (strategy === "none") {
      return;
    }

    let isMounted = true;
    let isChecking = false;
    let intervalId: number | undefined;

    const runCheck = async (): Promise<void> => {
      if (isChecking) {
        return;
      }

      isChecking = true;
      let authorized = false;

      try {
        const result = await effectiveCheckAuth();

        authorized = Boolean(result);
      } catch {
        authorized = false;
      } finally {
        isChecking = false;
      }

      if (!isMounted) {
        return;
      }

      if (authorized) {
        setStatus("allowed");

        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
          intervalId = undefined;
        }

        return;
      }

      setStatus("unauthorized");
    };

    let lastRevalidation = 0;

    const debouncedCheck = (): void => {
      const now = Date.now();

      if (now - lastRevalidation < REVALIDATION_COOLDOWN_MS) {
        return;
      }

      lastRevalidation = now;
      void runCheck();
    };

    const handleFocus = (): void => {
      debouncedCheck();
    };

    const handleVisibility = (): void => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        debouncedCheck();
      }
    };

    void runCheck();

    if (shouldPoll) {
      intervalId = window.setInterval(() => {
        void runCheck();
      }, revalidateIntervalMs);
    }

    if (shouldRevalidateOnFocus && typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibility);
      }
    }

    return () => {
      isMounted = false;

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }

      if (shouldRevalidateOnFocus && typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);

        if (typeof document !== "undefined") {
          document.removeEventListener("visibilitychange", handleVisibility);
        }
      }
    };
  }, [effectiveCheckAuth, revalidateIntervalMs, shouldPoll, shouldRevalidateOnFocus, strategy]);

  if (status === "allowed") {
    return <>{children}</>;
  }

  if (status === "unauthorized") {
    if (redirectTarget) {
      const isCrossOrigin = redirectTarget.startsWith("http://") || redirectTarget.startsWith("https://");

      if (isCrossOrigin) {
        if (typeof window !== "undefined") {
          window.location.href = redirectTarget;
        }

        return fallback ? <>{fallback}</> : null;
      }

      return <Navigate to={redirectTarget} replace />;
    }

    if (fallback !== null) {
      return <>{fallback}</>;
    }

    return null;
  }

  return fallback ? <>{fallback}</> : null;
};
