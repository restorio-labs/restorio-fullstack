/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type {
  FloorCanvas as FloorCanvasType,
  FloorElement,
  TableDisplayInfo,
  TableRuntimeState,
} from "@restorio/types";
import type { ReactNode } from "react";

import { cn } from "../utils";

import { FloorGrid } from "./grid";
import { FloorBar, FloorEntrance, FloorTable, FloorTableGroup, FloorWall, FloorZone } from "./primitives";

export interface FloorCanvasProps {
  layout: FloorCanvasType;
  showGrid?: boolean;
  gridCellSize?: number;
  tableStates?: Record<string, TableRuntimeState>;
  tableDisplayInfo?: Record<string, TableDisplayInfo>;
  selectedElementId?: string | null;
  className?: string;
  transformStyle?: string;
  centered?: boolean;
  interactive?: boolean;
  onElementPointerDown?: (
    id: string,
    e: React.PointerEvent,
    mode:
      | "move"
      | "resize-n"
      | "resize-s"
      | "resize-e"
      | "resize-w"
      | "resize-ne"
      | "resize-nw"
      | "resize-se"
      | "resize-sw",
    bounds: { x: number; y: number; w: number; h: number; rotation?: number },
  ) => void;
  onCanvasBackgroundPointerDown?: (e: React.PointerEvent) => void;
}

const renderElement = (
  el: FloorElement,
  tableStates: Record<string, TableRuntimeState>,
  tableDisplayInfo: Record<string, TableDisplayInfo>,
  selectedId: string | null,
  interactive: boolean,
  onElementPointerDown: FloorCanvasProps["onElementPointerDown"],
): ReactNode => {
  const bounds = { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation };
  const state = el.type === "table" && el.id ? (tableStates[el.id] ?? "free") : "free";
  const displayInfo = el.id ? tableDisplayInfo[el.id] : undefined;
  const isSelected = selectedId === el.id;
  const onPointerDown =
    interactive && onElementPointerDown
      ? (e: React.PointerEvent): void => onElementPointerDown(el.id, e, "move", bounds)
      : undefined;

  switch (el.type) {
    case "table":
      return (
        <FloorTable
          key={el.id}
          bounds={bounds}
          tableNumber={el.tableNumber}
          seats={el.seats}
          state={state}
          displayInfo={displayInfo}
          isSelected={isSelected}
          onPointerDown={onPointerDown}
        />
      );
    case "tableGroup":
      return (
        <FloorTableGroup
          key={el.id}
          bounds={bounds}
          tableNumbers={el.tableNumbers}
          seats={el.seats}
          state={state}
          displayInfo={displayInfo}
          isSelected={isSelected}
          onPointerDown={onPointerDown}
        />
      );
    case "bar":
      return <FloorBar key={el.id} bounds={bounds} label={el.label} onPointerDown={onPointerDown} />;
    case "zone":
      return <FloorZone key={el.id} bounds={bounds} name={el.name} color={el.color} onPointerDown={onPointerDown} />;
    case "wall":
      return <FloorWall key={el.id} bounds={bounds} onPointerDown={onPointerDown} />;
    case "entrance":
      return <FloorEntrance key={el.id} bounds={bounds} label={el.label} onPointerDown={onPointerDown} />;
    default:
      return null;
  }
};

export const FloorCanvas = ({
  layout,
  showGrid = true,
  gridCellSize = 20,
  tableStates = {},
  tableDisplayInfo = {},
  selectedElementId = null,
  className,
  transformStyle,
  centered = false,
  interactive = false,
  onElementPointerDown,
  onCanvasBackgroundPointerDown,
}: FloorCanvasProps): ReactNode => {
  const inner = (
    <div
      className={cn("relative overflow-hidden bg-background-secondary", !centered && className)}
      style={{
        width: layout.width,
        height: layout.height,
        ...(transformStyle ? { transform: transformStyle, transformOrigin: "0 0" } : {}),
      }}
    >
      <FloorGrid width={layout.width} height={layout.height} cellSize={gridCellSize} showGrid={showGrid} />
      <div
        className="relative z-10"
        style={{ width: layout.width, height: layout.height }}
        onPointerDown={
          onCanvasBackgroundPointerDown
            ? (e: React.PointerEvent): void => {
                if (e.target === e.currentTarget) {
                  onCanvasBackgroundPointerDown(e);
                }
              }
            : undefined
        }
      >
        {layout.elements.map((el) =>
          renderElement(el, tableStates, tableDisplayInfo, selectedElementId, interactive, onElementPointerDown),
        )}
      </div>
    </div>
  );

  if (centered) {
    return (
      <div className={cn("flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto", className)}>
        {inner}
      </div>
    );
  }

  return inner;
};
