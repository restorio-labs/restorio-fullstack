import { useCallback, useEffect, useState } from "react";

export type ViewMode = "sliding" | "all";

export interface UseViewModeReturn {
  viewMode: ViewMode;
  toggleViewMode: () => void;
}

export const useViewMode = (tenantId: string): UseViewModeReturn => {
  const storageKey = `kitchen-panel:tenant:${tenantId}:viewMode`;
  const [viewMode, setViewMode] = useState<ViewMode>("sliding");

  useEffect(() => {
    const storedViewMode = localStorage.getItem(storageKey) as ViewMode | null;

    if (storedViewMode === "sliding" || storedViewMode === "all") {
      setViewMode(storedViewMode);
    }
  }, [storageKey]);

  const toggleViewMode = useCallback((): void => {
    const nextMode: ViewMode = viewMode === "sliding" ? "all" : "sliding";

    setViewMode(nextMode);
    localStorage.setItem(storageKey, nextMode);
  }, [viewMode, storageKey]);

  return {
    viewMode,
    toggleViewMode,
  };
};
