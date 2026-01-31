import type { ReactElement, ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { TokenStorage } from "./storage";

export type AuthStrategy = "code" | "none";

export interface AuthGuardProps {
  strategy?: AuthStrategy;
  children: ReactNode;
  loginPath?: string;
}

const isJwtAuthenticated = (): boolean => {
  const token = TokenStorage.getAccessToken();

  if (!token) {
    return false;
  }

  return TokenStorage.isAccessTokenValid(token);
};

export const AuthGuard = ({ strategy = "code", children, loginPath = "/login" }: AuthGuardProps): ReactElement => {
  if (strategy === "none") {
    return <>{children}</>;
  }

  if (!isJwtAuthenticated()) {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
};
