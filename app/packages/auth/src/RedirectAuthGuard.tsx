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
}

export const RedirectAuthGuard = ({ children, redirectTo }: RedirectAuthGuardProps): ReactElement | null => {
  const [allowed, setAllowed] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setAllowed(true);
    } else {
      // window.location.href = redirectTo;
    }
  }, [redirectTo]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};
