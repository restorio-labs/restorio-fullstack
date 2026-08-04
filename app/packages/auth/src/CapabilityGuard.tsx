import type { AuthorizationAction, TenantCapabilitiesData } from "@restorio/types";
import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

interface CapabilityClient {
  tenants: {
    capabilities: (tenantId: string, signal?: AbortSignal) => Promise<TenantCapabilitiesData>;
  };
}

interface CapabilityContextValue {
  tenantId: string;
  policyVersion: string;
  capabilities: ReadonlySet<string>;
}

const CapabilityContext = createContext<CapabilityContextValue | null>(null);

export interface CapabilityGuardProps {
  children: ReactNode;
  client: CapabilityClient;
  tenantId: string | null | undefined;
  require: AuthorizationAction | AuthorizationAction[];
  match?: "all" | "any";
  redirectTo?: string;
  fallback?: ReactNode;
}

export const useCapabilities = (): CapabilityContextValue => {
  const context = useContext(CapabilityContext);
  if (context === null) {
    throw new Error("useCapabilities must be used within a CapabilityGuard");
  }
  return context;
};

export const useCan = (action: AuthorizationAction): boolean => {
  return useCapabilities().capabilities.has(action);
};

export const CapabilityGuard = ({
  children,
  client,
  tenantId,
  require,
  match = "all",
  redirectTo = "/",
  fallback = null,
}: CapabilityGuardProps): ReactElement | null => {
  const [data, setData] = useState<TenantCapabilitiesData | null>(null);
  const [denied, setDenied] = useState(false);
  const required = useMemo(() => (Array.isArray(require) ? require : [require]), [require]);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setDenied(false);
    if (!tenantId) {
      setDenied(true);
      return () => controller.abort();
    }
    void client.tenants
      .capabilities(tenantId, controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) {
          setDenied(true);
        }
      });
    return () => controller.abort();
  }, [client, tenantId]);

  if (denied) {
    return fallback === null ? <Navigate to={redirectTo} replace /> : <>{fallback}</>;
  }
  if (data === null || !tenantId) {
    return null;
  }

  const capabilities = new Set(data.capabilities);
  const allowed =
    match === "all"
      ? required.every((action) => capabilities.has(action))
      : required.some((action) => capabilities.has(action));
  if (!allowed) {
    return fallback === null ? <Navigate to={redirectTo} replace /> : <>{fallback}</>;
  }

  return (
    <CapabilityContext.Provider value={{ tenantId, policyVersion: data.policy_version, capabilities }}>
      {children}
    </CapabilityContext.Provider>
  );
};
