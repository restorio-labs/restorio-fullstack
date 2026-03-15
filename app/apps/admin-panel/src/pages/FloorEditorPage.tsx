import type { FloorCanvas as FloorCanvasType, Tenant } from "@restorio/types";
import { Button, Modal, useI18n, useMediaQuery, useToast } from "@restorio/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { tenantDetailsQueryKey, useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";
import { FloorLayoutEditorView } from "../views/FloorLayoutEditorView";

const FLOOR_EDITOR_NAVIGATION_EVENT = "restorio:floor-editor-navigation-attempt";

interface FloorEditorNavigationAttemptDetail {
  path: string;
}

const getActiveCanvas = (tenant: Tenant): FloorCanvasType | undefined => {
  const canvases = tenant.floorCanvases;

  if (canvases.length === 0) {
    return undefined;
  }

  return canvases.find((c) => c.id === tenant.activeLayoutVersionId) ?? canvases[0];
};

export const FloorEditorPage = (): ReactElement => {
  const { t } = useI18n();
  const isTabletUp = useMediaQuery("(min-width: 650px)");
  const { selectedTenantId, selectedTenantDetails: tenant, tenantsState, isSelectedTenantLoading } = useCurrentTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [headerActions, setHeaderActions] = useState<ReactElement | null>(null);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingCanvasId, setPendingCanvasId] = useState<string | null>(null);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const [floorNameDraft, setFloorNameDraft] = useState("");
  const [isDeletingCanvas, setIsDeletingCanvas] = useState(false);
  const { showToast } = useToast();

  const handleHeaderActionsChange = useCallback((actions: ReactElement | null) => {
    setHeaderActions(actions);
  }, []);

  useEffect(() => {
    if (!tenant) {
      setSelectedCanvasId(null);

      return;
    }

    const activeCanvas = getActiveCanvas(tenant);
    const hasSelectedCanvas = selectedCanvasId
      ? tenant.floorCanvases.some((canvas) => canvas.id === selectedCanvasId)
      : false;

    if (hasSelectedCanvas) {
      return;
    }

    setSelectedCanvasId(activeCanvas?.id ?? tenant.floorCanvases[0]?.id);
  }, [selectedCanvasId, tenant]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): string => {
      event.preventDefault();
      event.returnValue = "";

      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!tenant || !selectedCanvasId) {
      setFloorNameDraft("");

      return;
    }

    const selectedCanvas = tenant.floorCanvases.find((canvas) => canvas.id === selectedCanvasId);

    setFloorNameDraft(selectedCanvas?.name ?? "");
  }, [selectedCanvasId, tenant]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleNavigationAttempt = (event: Event): void => {
      const customEvent = event as CustomEvent<FloorEditorNavigationAttemptDetail>;
      const nextPath = customEvent.detail.path;

      if (!nextPath) {
        return;
      }

      event.preventDefault();
      setPendingNavigationPath(nextPath);
    };

    window.addEventListener(FLOOR_EDITOR_NAVIGATION_EVENT, handleNavigationAttempt as EventListener);

    return () => {
      window.removeEventListener(FLOOR_EDITOR_NAVIGATION_EVENT, handleNavigationAttempt as EventListener);
    };
  }, [isDirty]);

  const refreshTenantDetails = useCallback(async (): Promise<Tenant | null> => {
    if (!tenant) {
      return null;
    }

    await queryClient.invalidateQueries({ queryKey: tenantDetailsQueryKey(tenant.id) });

    return queryClient.fetchQuery({
      queryKey: tenantDetailsQueryKey(tenant.id),
      queryFn: () => api.tenants.get(tenant.id),
    });
  }, [queryClient, tenant]);

  const buildNextCanvasName = useCallback((): string => {
    const baseName = t("floorEditor.defaultCanvasNameBase");
    const takenNames = new Set((tenant?.floorCanvases ?? []).map((canvas) => canvas.name.trim().toLowerCase()));
    let index = (tenant?.floorCanvases.length ?? 0) + 1;

    while (takenNames.has(`${baseName} ${index}`.trim().toLowerCase())) {
      index += 1;
    }

    return `${baseName} ${index}`;
  }, [t, tenant]);

  const handleCanvasSelectionChange = useCallback(
    (nextCanvasId: string) => {
      if (nextCanvasId === selectedCanvasId) {
        return;
      }

      if (isDirty) {
        setPendingCanvasId(nextCanvasId);

        return;
      }

      setSelectedCanvasId(nextCanvasId);
    },
    [isDirty, selectedCanvasId],
  );

  const handleDiscardPendingCanvasChange = useCallback(() => {
    if (!pendingCanvasId) {
      return;
    }

    const nextCanvas = tenant?.floorCanvases.find((canvas) => canvas.id === pendingCanvasId);

    setSelectedCanvasId(pendingCanvasId);
    setFloorNameDraft(nextCanvas?.name ?? "");
    setPendingCanvasId(null);
    setIsDirty(false);
  }, [pendingCanvasId, tenant]);

  const handleKeepEditing = useCallback(() => {
    setPendingCanvasId(null);
    setPendingNavigationPath(null);
  }, []);

  const handleDiscardNavigation = useCallback(() => {
    setPendingCanvasId(null);

    if (!pendingNavigationPath) {
      return;
    }

    const nextPath = pendingNavigationPath;

    setPendingNavigationPath(null);
    setIsDirty(false);
    navigate(nextPath);
  }, [navigate, pendingNavigationPath]);

  const handleSetActiveCanvas = useCallback(
    async (canvasId: string): Promise<void> => {
      if (!tenant) {
        return;
      }

      await api.tenants.update(tenant.id, { activeLayoutVersionId: canvasId });
    },
    [tenant],
  );

  const handleCreateCanvas = useCallback(async (): Promise<void> => {
    if (!tenant || isCreatingCanvas) {
      return;
    }

    setIsCreatingCanvas(true);

    try {
      const createdCanvas = await api.floorCanvases.create(tenant.id, {
        name: buildNextCanvasName(),
        width: 1000,
        height: 800,
        elements: [],
      });

      await handleSetActiveCanvas(createdCanvas.id);
      const nextTenant = await refreshTenantDetails();
      const nextCanvas = nextTenant?.floorCanvases.find((canvas) => canvas.id === createdCanvas.id);

      setSelectedCanvasId(nextCanvas?.id ?? createdCanvas.id);
    } finally {
      setIsCreatingCanvas(false);
    }
  }, [buildNextCanvasName, handleSetActiveCanvas, isCreatingCanvas, refreshTenantDetails, tenant]);

  const handleSave = useCallback(
    async (layout: FloorCanvasType): Promise<void> => {
      if (!tenant) {
        return;
      }

      setIsSavingCanvas(true);

      try {
        await api.floorCanvases.update(tenant.id, layout.id, {
          name: floorNameDraft.trim() || layout.name,
          width: layout.width,
          height: layout.height,
          elements: layout.elements,
        });
        await handleSetActiveCanvas(layout.id);
        await refreshTenantDetails();
        setSelectedCanvasId(layout.id);
        setIsDirty(false);
        showToast("success", t("floorEditor.saveSuccessTitle"), t("floorEditor.saveSuccessMessage"));
      } catch (error) {
        console.error("Failed to save layout:", error);
        showToast("error", t("floorEditor.saveErrorTitle"), t("floorEditor.saveErrorMessage"));
      } finally {
        setIsSavingCanvas(false);
      }
    },
    [floorNameDraft, handleSetActiveCanvas, refreshTenantDetails, showToast, t, tenant],
  );

  const activeCanvasForEditor = tenant
    ? (tenant.floorCanvases.find((canvas) => canvas.id === selectedCanvasId) ?? getActiveCanvas(tenant) ?? null)
    : null;
  const isFirstFloor =
    tenant && activeCanvasForEditor ? tenant.floorCanvases[0]?.id === activeCanvasForEditor.id : false;
  const isFloorNameChanged = activeCanvasForEditor
    ? floorNameDraft.trim() !== "" && floorNameDraft.trim() !== activeCanvasForEditor.name
    : false;
  const canManageFloor = !isSavingCanvas && !isCreatingCanvas && !isDeletingCanvas;

  const handleDeleteCanvas = useCallback(async (): Promise<void> => {
    if (!tenant || !activeCanvasForEditor || isFirstFloor || !canManageFloor) {
      return;
    }

    const fallbackCanvas = tenant.floorCanvases.find((canvas) => canvas.id !== activeCanvasForEditor.id);

    if (!fallbackCanvas) {
      return;
    }

    setIsDeletingCanvas(true);

    try {
      await handleSetActiveCanvas(fallbackCanvas.id);
      await api.floorCanvases.delete(tenant.id, activeCanvasForEditor.id);
      await refreshTenantDetails();
      setSelectedCanvasId(fallbackCanvas.id);
      setIsDirty(false);
      showToast("success", t("floorEditor.deleteSuccessTitle"), t("floorEditor.deleteSuccessMessage"));
    } catch (error) {
      console.error("Failed to delete floor:", error);
      showToast("error", t("floorEditor.deleteErrorTitle"), t("floorEditor.deleteErrorMessage"));
    } finally {
      setIsDeletingCanvas(false);
    }
  }, [
    activeCanvasForEditor,
    canManageFloor,
    handleSetActiveCanvas,
    isFirstFloor,
    refreshTenantDetails,
    showToast,
    t,
    tenant,
  ]);

  const floorSelector = activeCanvasForEditor ? (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <span>{t("floorEditor.floorSelector.label")}</span>
        <select
          value={activeCanvasForEditor.id}
          onChange={(event) => handleCanvasSelectionChange(event.target.value)}
          className="min-w-[180px] rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
          disabled={!canManageFloor}
        >
          {tenant?.floorCanvases.map((canvas) => (
            <option key={canvas.id} value={canvas.id}>
              {canvas.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <span>{t("floorEditor.floorSelector.renameLabel")}</span>
        <input
          type="text"
          value={floorNameDraft}
          onChange={(event) => setFloorNameDraft(event.target.value)}
          className="min-w-[180px] rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
          disabled={!canManageFloor}
        />
      </label>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void handleCreateCanvas()}
        disabled={!canManageFloor}
      >
        {isCreatingCanvas ? t("floorEditor.creatingButton") : t("floorEditor.floorSelector.addFloor")}
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => void handleDeleteCanvas()}
        disabled={isFirstFloor || !canManageFloor || isDirty || isFloorNameChanged}
      >
        {isDeletingCanvas ? t("floorEditor.deletingButton") : t("floorEditor.floorSelector.deleteFloor")}
      </Button>
    </div>
  ) : null;

  if (!isTabletUp) {
    return (
      <PageLayout title={t("floorEditor.title")}>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-border-default bg-surface-primary p-6 text-center">
            <h2 className="text-lg font-semibold text-text-primary">{t("floorEditor.mobileUnavailableTitle")}</h2>
            <p className="mt-2 text-sm text-text-secondary">{t("floorEditor.mobileUnavailableMessage")}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (tenantsState === "loading" || tenantsState === "idle" || isSelectedTenantLoading) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.loadingDescription")}>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">{t("floorEditor.loadingRestaurant")}</div>
        </div>
      </PageLayout>
    );
  }

  if (!selectedTenantId) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.noRestaurantDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.noRestaurantMessage")}
        </div>
      </PageLayout>
    );
  }

  if (tenantsState === "error") {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.errorDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.errorMessage")}
        </div>
      </PageLayout>
    );
  }

  if (!tenant) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.errorDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.errorMessage")}
        </div>
      </PageLayout>
    );
  }

  const hasCanvases = tenant.floorCanvases.length > 0;

  if (!hasCanvases) {
    return (
      <PageLayout title={t("floorEditor.title")} description={tenant.name}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm text-text-tertiary">{t("floorEditor.emptyMessage")}</p>
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

  return (
    <>
      <PageLayout
        title={t("floorEditor.layoutTitle", { name: activeCanvasForEditor!.name })}
        description={tenant.name}
        headerActions={headerActions}
      >
        <FloorLayoutEditorView
          initialLayout={activeCanvasForEditor!}
          onSave={handleSave}
          onHeaderActionsChange={handleHeaderActionsChange}
          onDirtyChange={(nextIsDirty) => setIsDirty(nextIsDirty || isFloorNameChanged)}
          extraControls={floorSelector}
        />
      </PageLayout>
      <Modal
        isOpen={pendingCanvasId !== null || pendingNavigationPath !== null}
        onClose={handleKeepEditing}
        title={t("floorEditor.unsavedChanges.title")}
        closeOnOverlayClick={!isSavingCanvas}
        closeOnEscape={!isSavingCanvas}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">{t("floorEditor.unsavedChanges.message")}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleKeepEditing} disabled={isSavingCanvas}>
              {t("floorEditor.unsavedChanges.keepEditing")}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={pendingCanvasId !== null ? handleDiscardPendingCanvasChange : handleDiscardNavigation}
              disabled={isSavingCanvas}
            >
              {t("floorEditor.unsavedChanges.discard")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
