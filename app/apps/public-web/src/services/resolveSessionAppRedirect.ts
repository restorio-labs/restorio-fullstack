import type { AppSlug } from "@restorio/types";
import { resolveAuthenticatedAppRedirect } from "@restorio/utils";

import { api } from "@/api/client";

export const resolveSessionAppRedirect = async (lastVisitedApp?: string | null): Promise<AppSlug> => {
  const tenants = await api.tenants.list();
  const projections = await Promise.allSettled(tenants.map((tenant) => api.tenants.capabilities(tenant.id)));
  const capabilities = new Set(
    projections.flatMap((projection) => (projection.status === "fulfilled" ? projection.value.capabilities : [])),
  );

  return resolveAuthenticatedAppRedirect(capabilities, lastVisitedApp);
};
