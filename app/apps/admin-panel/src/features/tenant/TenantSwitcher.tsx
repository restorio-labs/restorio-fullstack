import { Select } from "@restorio/ui";
import type { ReactElement } from "react";

import { useCurrentTenant } from "../../context/TenantContext";

export const TenantSwitcher = (): ReactElement | null => {
  const { tenants, tenantsState, selectedTenantId, setSelectedTenantId } = useCurrentTenant();

  if (tenantsState === "error") {
    return <div className="text-sm text-status-error-text">Failed to load restaurants.</div>;
  }

  if (tenantsState === "loading" || tenantsState === "idle") {
    return <div className="text-sm text-text-tertiary">Loading restaurants...</div>;
  }

  if (tenants.length === 0) {
    return <div className="text-sm text-text-tertiary">No restaurants available.</div>;
  }

  return (
    <div className="w-full max-w-xs">
      <Select
        aria-label="Current restaurant"
        value={selectedTenantId ?? ""}
        onChange={(e) => setSelectedTenantId(e.target.value)}
        options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
      />
    </div>
  );
};
