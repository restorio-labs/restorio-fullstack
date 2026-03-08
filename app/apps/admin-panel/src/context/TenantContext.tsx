import type { Tenant, TenantSummary } from "@restorio/types";
import { TENANT_STORAGE_KEY } from "@restorio/utils";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useTenants } from "../hooks/useTenants";

type TenantsState = "idle" | "loading" | "loaded" | "error";

interface TenantContextValue {
  tenants: TenantSummary[];
  tenantsState: TenantsState;
  selectedTenantId: string | null;
  selectedTenant: TenantSummary | null;
  selectedTenantDetails: Tenant | null;
  isSelectedTenantLoading: boolean;
  setSelectedTenantId: (tenantId: string) => void;
  refreshTenants: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  children: ReactNode;
}

export const tenantDetailsQueryKey = (tenantId: string): readonly string[] => ["tenant", tenantId];

export const TenantProvider = ({ children }: TenantProviderProps): ReactElement => {
  const { tenants, state, refresh } = useTenants();
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);

  useEffect(() => {
    const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);

    setSelectedTenantIdState(storedTenantId);
  }, []);

  useEffect(() => {
    if (state !== "loaded") {
      return;
    }

    const selectedTenantStillExists = selectedTenantId
      ? tenants.some((tenant) => tenant.id === selectedTenantId)
      : false;

    if (selectedTenantStillExists) {
      return;
    }

    const fallbackTenantId = tenants[0]?.id ?? null;

    setSelectedTenantIdState(fallbackTenantId);
  }, [state, selectedTenantId, tenants]);

  const shouldFetchDetails = state === "loaded" && selectedTenantId !== null;

  const { data: selectedTenantDetails = null, status: detailsStatus } = useQuery({
    queryKey: tenantDetailsQueryKey(selectedTenantId ?? ""),
    queryFn: () => api.tenants.get(selectedTenantId!),
    enabled: shouldFetchDetails,
  });

  useEffect(() => {
    if (selectedTenantId) {
      localStorage.setItem(TENANT_STORAGE_KEY, selectedTenantId);

      return;
    }

    localStorage.removeItem(TENANT_STORAGE_KEY);
  }, [selectedTenantId]);

  const setSelectedTenantId = (tenantId: string): void => {
    setSelectedTenantIdState(tenantId || null);
  };

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants],
  );

  const isSelectedTenantLoading =
    state === "idle" || state === "loading" || (shouldFetchDetails && detailsStatus === "pending");

  const value = useMemo<TenantContextValue>(
    () => ({
      tenants,
      tenantsState: state,
      selectedTenantId,
      selectedTenant,
      selectedTenantDetails,
      isSelectedTenantLoading,
      setSelectedTenantId,
      refreshTenants: refresh,
    }),
    [isSelectedTenantLoading, refresh, selectedTenant, selectedTenantDetails, selectedTenantId, state, tenants],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useCurrentTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useCurrentTenant must be used within TenantProvider");
  }

  return context;
};
