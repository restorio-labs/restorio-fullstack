import type { FloorTableElement, Tenant } from "@restorio/types";
import { getAppHref } from "@restorio/utils";

export interface TenantFloorTablesGroup {
  canvasId: string;
  floorName: string;
  tables: number[];
}

export interface TenantFloorTableEntry {
  canvasId: string;
  floorName: string;
  tableId: number;
}

export const getTenantTablesByFloor = (tenant: Tenant): TenantFloorTablesGroup[] => {
  return tenant.floorCanvases.map((canvas) => {
    const tableElements = canvas.elements.filter((element): element is FloorTableElement => element.type === "table");

    return {
      canvasId: canvas.id,
      floorName: canvas.name,
      tables: tableElements.map((element) => element.tableNumber).sort((a, b) => a - b),
    };
  });
};

export const getTenantTableEntries = (tenant: Tenant): TenantFloorTableEntry[] => {
  return getTenantTablesByFloor(tenant).flatMap((floor) =>
    floor.tables.map((tableId) => ({
      canvasId: floor.canvasId,
      floorName: floor.floorName,
      tableId,
    })),
  );
};

export const getTableQrUrl = (tenantSlug: string, tableId: number): string => {
  return `${getAppHref("mobile-app")}/${tenantSlug}/table/${tableId}`;
};
