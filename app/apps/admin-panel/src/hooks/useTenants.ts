import type { TenantSummary } from "@restorio/types";
import { useEffect, useState } from "react";

import { api } from "../api/client";

type TenantsState = "idle" | "loading" | "loaded" | "error";

let cachedTenants: TenantSummary[] | null = null;
let loadPromise: Promise<TenantSummary[]> | null = null;

export const useTenants = (): {
  tenants: TenantSummary[];
  state: TenantsState;
} => {
  const [state, setState] = useState<TenantsState>("idle");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);

  useEffect(() => {
    if (cachedTenants) {
      setTenants(cachedTenants);
      setState("loaded");

      return;
    }

    setState("loading");

    if (!loadPromise) {
      loadPromise = api.tenants.list();
    }

    void loadPromise
      .then((data) => {
        cachedTenants = data;
        setTenants(data);
        setState("loaded");
      })
      .catch(() => {
        setState("error");
      });
  }, []);

  return { tenants, state };
};
