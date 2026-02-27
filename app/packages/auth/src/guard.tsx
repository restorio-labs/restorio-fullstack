import { ApiClient } from "@restorio/api-client";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { TokenStorage } from "./storage";

export type AuthStrategy = "code" | "none";

export interface AuthGuardProps {
  strategy?: AuthStrategy;
  children: ReactNode;
  loginPath?: string;
  redirectTo?: string;
  fallback?: ReactNode;
  checkAuth?: () => boolean | Promise<boolean>;
  revalidateIntervalMs?: number;
  revalidateOnFocus?: boolean;
  sessionPath?: string;
  refreshPath?: string;
  apiBaseUrl?: string;
}

type AuthStatus = "pending" | "allowed" | "unauthorized";

const DEFAULT_SESSION_PATH = "/api/v1/auth/me";
const DEFAULT_REFRESH_PATH = "/api/v1/auth/refresh";

const fallbackTokenCheck = (): boolean => {
  const accessToken = TokenStorage.getAccessToken();

  if (accessToken && TokenStorage.isAccessTokenValid(accessToken)) {
    return true;
  }

  const refreshToken = TokenStorage.getRefreshToken();

  return Boolean(refreshToken);
};

const createDefaultCheckAuth = (sessionPath: string, refreshPath?: string, apiBaseUrl?: string) => {
  if (typeof window === "undefined") {
    return () => fallbackTokenCheck();
  }

  const baseURL = apiBaseUrl ?? window.location.origin;
  const client = new ApiClient({
    baseURL,
    refreshPath,
  });

  return async (): Promise<boolean> => {
    try {
      await client.get(sessionPath);

      return true;
    } catch (error) {
      const maybeAxiosError = error as { response?: { status?: number } } | undefined;
      const status = maybeAxiosError?.response?.status;

      if (status === undefined) {
        return fallbackTokenCheck();
      }

      if (status === 401) {
        return false;
      }

      return false;
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
  revalidateIntervalMs,
  revalidateOnFocus = true,
  sessionPath = DEFAULT_SESSION_PATH,
  refreshPath = DEFAULT_REFRESH_PATH,
  apiBaseUrl,
}: AuthGuardProps): ReactElement | null => {
  const [status, setStatus] = useState<AuthStatus>(strategy === "none" ? "allowed" : "pending");

  const redirectTarget = redirectTo ?? loginPath;
  const shouldPoll = useMemo(() => Boolean(revalidateIntervalMs && revalidateIntervalMs > 0), [revalidateIntervalMs]);
  const shouldRevalidateOnFocus = useMemo(() => Boolean(revalidateOnFocus), [revalidateOnFocus]);
  const effectiveCheckAuth = useMemo(
    () => checkAuth ?? createDefaultCheckAuth(sessionPath, refreshPath, apiBaseUrl),
    [apiBaseUrl, checkAuth, refreshPath, sessionPath],
  );

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

    const handleFocus = (): void => {
      void runCheck();
    };

    const handleVisibility = (): void => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void runCheck();
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
