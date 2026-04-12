import type { ReactElement, ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuthContext } from "./AuthContext";

export type UserRole = "super_admin" | "admin" | "owner" | "manager" | "waiter" | "kitchen_staff";

export interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export const useCurrentRole = (): UserRole | null => {
  const { role } = useAuthContext();

  return role;
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
