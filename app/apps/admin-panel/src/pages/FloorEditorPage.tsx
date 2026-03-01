import type { FloorCanvas as FloorCanvasType, LoadingState, Tenant } from "@restorio/types";
import { useI18n, useToast } from "@restorio/ui";
import { useEffect, useState, type ReactElement } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";
import { FloorLayoutEditorView } from "../views/FloorLayoutEditorView";

const getActiveCanvas = (tenant: Tenant): FloorCanvasType | undefined => {
  const canvases = tenant.floorCanvases;

  if (canvases.length === 0) {
    return undefined;
  }

  return canvases.find((c) => c.id === tenant.activeLayoutVersionId) ?? canvases[0];
};

export const FloorEditorPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId, tenantsState } = useCurrentTenant();

  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (tenantsState !== "loaded") {
      return;
    }

    if (!selectedTenantId) {
      setLoadingState("not-found");

      return;
    }

    setLoadingState("loading");

    const fetchTenant = async (): Promise<void> => {
      try {
        const data = await api.tenants.get(selectedTenantId);

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
  }, [selectedTenantId, tenantsState]);

  if (tenantsState === "loading" || tenantsState === "idle" || loadingState === "loading") {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.loadingDescription")}>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">{t("floorEditor.loadingRestaurant")}</div>
        </div>
      </PageLayout>
    );
  }

  if (!selectedTenantId || loadingState === "not-found" || !tenant) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.noRestaurantDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.noRestaurantMessage")}
        </div>
      </PageLayout>
    );
  }

  if (loadingState === "error") {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.errorDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.errorMessage")}
        </div>
      </PageLayout>
    );
  }

  const hasCanvases = tenant.floorCanvases.length > 0;

  const handleCreateCanvas = async (): Promise<void> => {
    if (isCreatingCanvas) {
      return;
    }

    setIsCreatingCanvas(true);

    try {
      await api.floorCanvases.create(tenant.id, {
        name: t("floorEditor.defaultCanvasName"),
        width: 1000,
        height: 800,
        elements: [],
      });

      const updated = await api.tenants.get(tenant.id);

      setTenant(updated);
    } finally {
      setIsCreatingCanvas(false);
    }
  };

  if (!hasCanvases) {
    return (
      <PageLayout title={t("floorEditor.title")} description={tenant.name}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm text-text-tertiary">
            {t("floorEditor.emptyMessage")}
          </p>
          <button
            type="button"
            onClick={() => void handleCreateCanvas()}
            disabled={isCreatingCanvas}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            {isCreatingCanvas ? t("floorEditor.creatingButton") : t("floorEditor.createButton")}
          </button>
        </div>
      </PageLayout>
    );
  }

  const activeCanvasForEditor = getActiveCanvas(tenant)!;

  const handleSave = async (layout: FloorCanvasType): Promise<void> => {
    try {
      await api.floorCanvases.update(tenant.id, activeCanvasForEditor.id, {
        name: layout.name,
        width: layout.width,
        height: layout.height,
        elements: layout.elements,
      });
      showToast("success", t("floorEditor.saveSuccessTitle"), t("floorEditor.saveSuccessMessage"));
    } catch (error) {
      console.error("Failed to save layout:", error);
      showToast("error", t("floorEditor.saveErrorTitle"), t("floorEditor.saveErrorMessage"));
    }
  };

  return (
    <PageLayout title={t("floorEditor.layoutTitle", { name: activeCanvasForEditor.name })} description={tenant.name}>
      <FloorLayoutEditorView initialLayout={activeCanvasForEditor} onSave={handleSave} />
    </PageLayout>
  );
};
