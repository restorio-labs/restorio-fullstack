import type { Tenant, TenantSummary } from "@restorio/types";
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

const TENANT_STORAGE_KEY = "admin-panel:selected-tenant-id";

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps): ReactElement => {
  const { tenants, state, refresh } = useTenants();
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<Tenant | null>(null);
  const [selectedTenantDetailsState, setSelectedTenantDetailsState] = useState<TenantsState>("idle");

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

  useEffect(() => {
    if (state !== "loaded" || !selectedTenantId) {
      setSelectedTenantDetails(null);
      setSelectedTenantDetailsState(state === "error" ? "error" : "idle");

      return;
    }

    let cancelled = false;

    setSelectedTenantDetails(null);
    setSelectedTenantDetailsState("loading");

    const fetchTenant = async (): Promise<void> => {
      try {
        const data = await api.tenants.get(selectedTenantId);

        if (!cancelled) {
          setSelectedTenantDetails(data);
          setSelectedTenantDetailsState("loaded");
        }
      } catch (error) {
        console.error("Failed to fetch tenant:", error);

        if (!cancelled) {
          setSelectedTenantDetails(null);
          setSelectedTenantDetailsState("error");
        }
      }
    };

    void fetchTenant();

    return () => {
      cancelled = true;
    };
  }, [selectedTenantId, state]);

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

  const isSelectedTenantLoading = state === "idle" || state === "loading" || selectedTenantDetailsState === "loading";

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
