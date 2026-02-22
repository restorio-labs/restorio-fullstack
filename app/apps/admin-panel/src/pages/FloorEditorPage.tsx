import type { FloorCanvas as FloorCanvasType, Tenant } from "@restorio/types";
import { useEffect, useState, type ReactElement } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { PageLayout } from "../layouts/PageLayout";
import { FloorLayoutEditorView } from "../views/FloorLayoutEditorView";

type LoadingState = "loading" | "loaded" | "error" | "not-found";

const getActiveCanvas = (tenant: Tenant): FloorCanvasType | undefined => {
  const canvases = tenant.floorCanvases;

  if (canvases.length === 0) {
    return undefined;
  }

  return canvases.find((c) => c.id === tenant.activeLayoutVersionId) ?? canvases[0];
};

export const FloorEditorPage = (): ReactElement => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoadingState("not-found");

      return;
    }

    const fetchTenant = async (): Promise<void> => {
      if (!restaurantId) {
        setLoadingState("not-found");

        return;
      }

      try {
        const data = await api.tenants.get(restaurantId);

        setTenant(data);
        setLoadingState("loaded");
      } catch (error) {
        const httpError = error as { response?: { status?: number } };

        if (httpError.response?.status === 404) {
          setLoadingState("not-found");
        } else {
          setLoadingState("error");
        }
      }
    };

    void fetchTenant();
  }, [restaurantId]);

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="text-sm font-medium text-interactive-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
    >
      Back to restaurants
    </button>
  );

  if (loadingState === "loading") {
    return (
      <PageLayout title="Floor layout" description="Loading..." headerActions={headerActions}>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading restaurant...</div>
        </div>
      </PageLayout>
    );
  }

  if (loadingState === "not-found" || !tenant) {
    return <Navigate to="/" replace />;
  }

  if (loadingState === "error") {
    return (
      <PageLayout title="Floor layout" description="Error" headerActions={headerActions}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load restaurant. Please try again later.
        </div>
      </PageLayout>
    );
  }

  const hasCanvases = tenant.floorCanvases.length > 0;
  const activeCanvas = hasCanvases ? getActiveCanvas(tenant) : undefined;

  if (!hasCanvases || activeCanvas === undefined) {
    return (
      <PageLayout title="Floor layout" description={tenant.name} headerActions={headerActions}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          No saved floor layouts exist for this restaurant yet. Add one from the restaurants list or contact support if
          you believe this is an error.
        </div>
      </PageLayout>
    );
  }

  const handleSave = async (layout: FloorCanvasType): Promise<void> => {
    try {
      await api.floorCanvases.update(tenant.id, activeCanvas.id, {
        name: layout.name,
        width: layout.width,
        height: layout.height,
        elements: layout.elements,
      });
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  return (
    <PageLayout title={`Floor: ${activeCanvas.name}`} description={tenant.name} headerActions={headerActions}>
      <FloorLayoutEditorView initialLayout={activeCanvas} onSave={handleSave} />
    </PageLayout>
  );
};
