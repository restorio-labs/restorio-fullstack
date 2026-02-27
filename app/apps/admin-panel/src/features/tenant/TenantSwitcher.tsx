import { Dropdown } from "@restorio/ui";
import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCurrentTenant } from "../../context/TenantContext";

export const TenantSwitcher = (): ReactElement | null => {
  const { tenants, tenantsState, selectedTenantId, selectedTenant, setSelectedTenantId } = useCurrentTenant();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (tenantsState === "error") {
    return <div className="text-sm text-status-error-text">Failed to load restaurants.</div>;
  }

  if (tenantsState === "loading" || tenantsState === "idle") {
    return <div className="text-sm text-text-tertiary">Loading restaurants...</div>;
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-text-tertiary">No restaurants available.</div>
        <button
          type="button"
          onClick={() => navigate("/restaurant-creator")}
          className="text-sm font-medium text-interactive-primary hover:underline"
        >
          + Add new restaurant
        </button>
      </div>
    );
  }

  return (
    <div className="w-full [&>div]:block [&>div]:w-full">
      <Dropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom-start"
        className="w-full"
        trigger={
          <div className="flex w-full items-center justify-between rounded-lg border border-border-default bg-surface-primary px-5 py-4 text-base font-medium text-text-primary shadow-sm transition hover:bg-surface-secondary">
            <span className="truncate">{selectedTenant?.name ?? "Select restaurant"}</span>
            <svg className="ml-3 h-5 w-5 shrink-0 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        }
      >
        <div className="max-h-90 overflow-y-auto p-2">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              className={`w-full rounded-md px-4 py-2 text-left text-base hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus ${
                tenant.id === selectedTenantId ? "font-semibold text-interactive-primary" : "text-text-primary"
              }`}
              onClick={() => {
                setSelectedTenantId(tenant.id);
                setIsOpen(false);
              }}
            >
              {tenant.name}
            </button>
          ))}
          <div className="my-2 border-t border-border-default" />
          <button
            type="button"
            className="w-full rounded-md px-4 py-2 text-left text-base font-semibold text-interactive-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus"
            onClick={() => {
              navigate("/restaurant-creator");
              setIsOpen(false);
            }}
          >
            + Add new restaurant
          </button>
        </div>
      </Dropdown>
    </div>
  );
};
