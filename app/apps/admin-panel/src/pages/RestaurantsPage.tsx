import type { FloorCanvas } from "@restorio/types";
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useTenants } from "../hooks/useTenants";
import { PageLayout } from "../layouts/PageLayout";
import { RestaurantsView } from "../views/RestaurantsView";

const getActiveCanvas = (tenant: {
  floorCanvases: FloorCanvas[];
  activeLayoutVersionId: string | null;
}): FloorCanvas | null => {
  if (tenant.floorCanvases.length === 0) {
    return null;
  }

  return (
    tenant.floorCanvases.find((canvas: FloorCanvas) => canvas.id === tenant.activeLayoutVersionId) ??
    tenant.floorCanvases[0]
  );
};

export const RestaurantsPage = (): ReactElement => {
  const navigate = useNavigate();
  const { tenants, state } = useTenants();
  const [activeCanvasesByTenantId, setActiveCanvasesByTenantId] = useState<Record<string, FloorCanvas | null>>({});

  useEffect(() => {
    const fetchCanvases = async (): Promise<void> => {
      if (state !== "loaded" || tenants.length === 0) {
        return;
      }

      try {
        const tenantsWithCanvases = tenants.filter((tenant) => tenant.floorCanvasCount > 0);
        const tenantDetails = await Promise.allSettled(tenantsWithCanvases.map((tenant) => api.tenants.get(tenant.id)));
        const nextActiveCanvasesByTenantId: Record<string, FloorCanvas | null> = {};

        tenantDetails.forEach((result, index) => {
          if (result.status !== "fulfilled") {
            return;
          }

          const tenantSummary = tenantsWithCanvases[index];
          const activeCanvas = getActiveCanvas(result.value);

          nextActiveCanvasesByTenantId[tenantSummary.id] = activeCanvas;
        });

        setActiveCanvasesByTenantId(nextActiveCanvasesByTenantId);
      } catch {
        // ignore; state will stay as-is
      }
    };

    void fetchCanvases();
  }, [state, tenants]);

  if (state === "idle" || state === "loading") {
    return (
      <PageLayout title="Restaurants" description="Manage restaurant floor layouts">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading restaurants...</div>
        </div>
      </PageLayout>
    );
  }

  if (state === "error") {
    return (
      <PageLayout title="Restaurants" description="Manage restaurant floor layouts">
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load restaurants. Please try again later.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Restaurants" description="Manage restaurant floor layouts">
      <RestaurantsView
        restaurants={tenants}
        activeCanvasesByVenueId={activeCanvasesByTenantId}
        onSelectVenue={(tenant) => navigate(`/restaurants/${tenant.id}/floor`)}
        onAddVenue={() => navigate("/restaurant-creator")}
      />
    </PageLayout>
  );
};
