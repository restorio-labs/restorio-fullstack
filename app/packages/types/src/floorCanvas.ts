export type TableRuntimeState = "free" | "occupied" | "reserved" | "dirty";

export type OrderStatusDisplay = "browsing" | "ordering" | "ordered" | "preparing" | "served" | "bill_requested";

export interface TableDisplayInfo {
  guestCount?: number;
  orderStatus?: OrderStatusDisplay;
  needHelp?: boolean;
}

export interface CanvasBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

export interface FloorElementBase extends CanvasBounds {
  id: string;
  zoneId?: string;
}

export interface FloorTableElement extends FloorElementBase {
  type: "table";
  tableNumber: string;
  seats: number;
  tableId?: string;
}

export interface FloorTableGroupElement extends FloorElementBase {
  type: "tableGroup";
  tableNumbers: string[];
  seats: number;
  tableIds?: string[];
}

export interface FloorBarElement extends FloorElementBase {
  type: "bar";
  label?: string;
}

export interface FloorZoneElement extends FloorElementBase {
  type: "zone";
  name: string;
  color?: string;
}

export interface FloorWallElement extends FloorElementBase {
  type: "wall";
}

export interface FloorEntranceElement extends FloorElementBase {
  type: "entrance";
  label?: string;
}

export type FloorElement =
  | FloorTableElement
  | FloorTableGroupElement
  | FloorBarElement
  | FloorZoneElement
  | FloorWallElement
  | FloorEntranceElement;

export interface FloorCanvas {
  id: string;
  venueId: string;
  name: string;
  width: number;
  height: number;
  elements: FloorElement[];
  version: number;
}

export interface Venue {
  id: string;
  tenantId: string;
  name: string;
  floorCanvases: FloorCanvas[];
  activeLayoutVersionId: string | null;
}

export interface VenueSummary extends Omit<Venue, "floorCanvases"> {
  floorCanvasCount: number;
}

export const createInitialLayout = (venueId: string, name: string, width: number, height: number): FloorCanvas => ({
  id: `canvas-${venueId}-1`,
  venueId,
  name,
  width,
  height,
  elements: [],
  version: 1,
});
