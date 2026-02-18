import type { FloorCanvas, Tenant, TenantSummary } from "@restorio/types";
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { PageLayout } from "../layouts/PageLayout";
import { VenuesView } from "../views/VenuesView";

type LoadingState = "loading" | "loaded" | "error";

const getActiveCanvas = (tenant: Tenant): FloorCanvas | null => {
  if (tenant.floorCanvases.length === 0) {
    return null;
  }

  return tenant.floorCanvases.find((canvas) => canvas.id === tenant.activeLayoutVersionId) ?? tenant.floorCanvases[0];
};

export const VenuesPage = (): ReactElement => {
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeCanvasesByTenantId, setActiveCanvasesByTenantId] = useState<Record<string, FloorCanvas | null>>({});

  useEffect(() => {
    const fetchTenants = async (): Promise<void> => {
      try {
        const data = await api.tenants.list();
        const tenantsWithCanvases = data.filter((tenant) => tenant.floorCanvasCount > 0);
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

        setTenants(data);
        setActiveCanvasesByTenantId(nextActiveCanvasesByTenantId);
        setLoadingState("loaded");
      } catch {
        setLoadingState("error");
      }
    };

    void fetchTenants();
  }, []);

  if (loadingState === "loading") {
    return (
      <PageLayout title="Venues" description="Manage venue floor layouts">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading venues...</div>
        </div>
      </PageLayout>
    );
  }

  if (loadingState === "error") {
    return (
      <PageLayout title="Venues" description="Manage venue floor layouts">
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load venues. Please try again later.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Venues" description="Manage venue floor layouts">
      <VenuesView
        venues={tenants}
        activeCanvasesByVenueId={activeCanvasesByTenantId}
        onSelectVenue={(tenant) => navigate(`/venues/${tenant.id}/floor`)}
        onAddVenue={() => navigate("/venue-creator")}
      />
    </PageLayout>
  );
};
