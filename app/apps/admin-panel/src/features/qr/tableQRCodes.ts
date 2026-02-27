import type { FloorTableElement, Tenant } from "@restorio/types";
import { getAppHref } from "@restorio/utils";

export const getTenantTablesFromActiveCanvas = (tenant: Tenant): number[] => {
  if (tenant.floorCanvases.length === 0) {
    return [];
  }

  const activeCanvas = tenant.floorCanvases.find((canvas) => canvas.id === tenant.activeLayoutVersionId) ?? tenant.floorCanvases[0];
  const tableElements = activeCanvas.elements.filter((element): element is FloorTableElement => element.type === "table");

  return tableElements
    .map((element) => element.tableNumber)
    .sort((a, b) => a - b);
};

export const getTableQrUrl = (tenantSlug: string, tableId: number): string => {
  return `${getAppHref("mobile-app")}/${tenantSlug}/table/${tableId}`;
};
