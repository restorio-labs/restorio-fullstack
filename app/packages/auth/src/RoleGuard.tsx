import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";
import { Navigate } from "react-router-dom";

import { TokenStorage } from "./storage";

export type UserRole = "super_admin" | "admin" | "owner" | "manager" | "waiter" | "kitchen_staff";

export interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

const getRoleFromToken = (): UserRole | null => {
  const token = TokenStorage.getAccessToken();

  if (!token) {
    return null;
  }

  const codePattern = /^\d{3}-\d{3}$/;

  if (codePattern.test(token)) {
    return null;
  }

  const decoded = TokenStorage.decodeToken(token);

  if (!decoded?.account_type) {
    return null;
  }

  return decoded.account_type as UserRole;
};

export const useCurrentRole = (): UserRole | null => {
  return useMemo(() => getRoleFromToken(), []);
};

export const RoleGuard = ({
  children,
  allowedRoles,
  redirectTo = "/",
  fallback = null,
}: RoleGuardProps): ReactElement | null => {
  const currentRole = useCurrentRole();

  if (!currentRole) {
    if (fallback !== null) {
      return <>{fallback}</>;
    }

    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    if (fallback !== null) {
      return <>{fallback}</>;
    }

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
