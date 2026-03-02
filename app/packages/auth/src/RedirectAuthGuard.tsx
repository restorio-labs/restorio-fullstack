import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";

import { TokenStorage } from "./storage";

const isAuthenticated = (): boolean => {
  const token = TokenStorage.getAccessToken();

  if (!token) {
    return false;
  }

  return TokenStorage.isAccessTokenValid(token);
};

export interface RedirectAuthGuardProps {
  children: ReactNode;
  redirectTo: string;
  checkAuth?: () => boolean | Promise<boolean>;
}

export const RedirectAuthGuard = ({ children, redirectTo, checkAuth }: RedirectAuthGuardProps): ReactElement | null => {
  const [allowed, setAllowed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const runCheck = async (): Promise<void> => {
      const authorized = checkAuth ? await checkAuth() : isAuthenticated();

      if (!isMounted) {
        return;
      }

      if (authorized) {
        setAllowed(true);

        return;
      }

      window.location.href = redirectTo;
    };

    void runCheck();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, redirectTo]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};
