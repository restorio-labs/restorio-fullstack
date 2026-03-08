import type { FloorCanvas as FloorCanvasType, FloorElement } from "@restorio/types";
import { FloorCanvas, type DragResizeMode, useI18n } from "@restorio/ui";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";

import { GRID_CELL, HANDLE_SIZE, RESIZE_HANDLES } from "../editorShared";

interface FloorEditorCanvasProps {
  layout: FloorCanvasType;
  selectedIds: string[];
  selectedElements: FloorElement[];
  selectedElement: FloorElement | null;
  onElementPointerDown: (
    id: string,
    e: ReactPointerEvent,
    mode: DragResizeMode,
    bounds: { x: number; y: number; w: number; h: number; rotation?: number },
  ) => void;
  onClearSelection: () => void;
}

export const FloorEditorCanvas = ({
  layout,
  selectedIds,
  selectedElements,
  selectedElement,
  onElementPointerDown,
  onClearSelection,
}: FloorEditorCanvasProps): ReactElement => {
  const { t } = useI18n();
  const hasMultiSelection = selectedIds.length > 1;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-l-lg border border-border-default bg-background-secondary">
      <div className="flex flex-1 overflow-auto p-2">
        <div className="relative min-h-fit min-w-fit" style={{ touchAction: "none" }}>
          <FloorCanvas
            layout={layout}
            showGrid
            gridCellSize={GRID_CELL}
            selectedElementId={selectedElement?.id ?? null}
            interactive
            onElementPointerDown={onElementPointerDown}
            onCanvasBackgroundPointerDown={onClearSelection}
          />
          {hasMultiSelection &&
            selectedElements.map((element) => (
              <div
                key={`multi-select-${element.id}`}
                className="absolute left-0 top-0 z-20 pointer-events-none border-2 border-border-focus bg-transparent rounded-sm"
                style={{
                  transform: `translate(${element.x}px, ${element.y}px)`,
                  width: element.w,
                  height: element.h,
                }}
                aria-hidden="true"
              />
            ))}
          {selectedElement && selectedIds.length === 1 && (
            <div
              className="absolute left-0 top-0 z-20 pointer-events-none"
              style={{
                transform: `translate(${selectedElement.x}px, ${selectedElement.y}px)`,
                width: selectedElement.w,
                height: selectedElement.h,
              }}
            >
              {RESIZE_HANDLES.map(({ mode, left, top, cursor }) => (
                <div
                  key={mode}
                  className="absolute border-2 border-border-focus bg-surface-primary pointer-events-auto rounded-sm"
                  style={{
                    cursor,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    left: left === "50%" ? "50%" : left === "100%" ? "100%" : left,
                    top: top === "50%" ? "50%" : top === "100%" ? "100%" : top,
                    marginLeft: left === "50%" ? -HANDLE_SIZE / 2 : left === "100%" ? -HANDLE_SIZE : 0,
                    marginTop: top === "50%" ? -HANDLE_SIZE / 2 : top === "100%" ? -HANDLE_SIZE : 0,
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onElementPointerDown(selectedElement.id, e, mode, {
                      x: selectedElement.x,
                      y: selectedElement.y,
                      w: selectedElement.w,
                      h: selectedElement.h,
                      rotation: selectedElement.rotation,
                    });
                  }}
                  aria-label={t("floorEditor.aria.resizeHandle", { mode })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
