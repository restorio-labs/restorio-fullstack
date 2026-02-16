import type { ElementToAdd, FloorCanvas as FloorCanvasType, FloorLayoutEditorState } from "@restorio/types";
import { Button, FloorCanvas, useDragResize, type DragResizeMode, useSnapToGrid } from "@restorio/ui";
import type { ReactElement } from "react";
import { useCallback, useEffect, useReducer, useState } from "react";

import { createElementFromToAdd, layoutHistoryReducer } from "../features/floor/types";

const GRID_CELL = 20;
const HANDLE_SIZE = 12;
const RESIZE_HANDLES: { mode: DragResizeMode; left: string; top: string; cursor: string }[] = [
  { mode: "resize-nw", left: "0", top: "0", cursor: "nwse-resize" },
  { mode: "resize-n", left: "50%", top: "0", cursor: "n-resize" },
  { mode: "resize-ne", left: "100%", top: "0", cursor: "nesw-resize" },
  { mode: "resize-e", left: "100%", top: "50%", cursor: "e-resize" },
  { mode: "resize-se", left: "100%", top: "100%", cursor: "nwse-resize" },
  { mode: "resize-s", left: "50%", top: "100%", cursor: "s-resize" },
  { mode: "resize-sw", left: "0", top: "100%", cursor: "nesw-resize" },
  { mode: "resize-w", left: "0", top: "50%", cursor: "w-resize" },
];

interface FloorLayoutEditorViewProps {
  initialLayout: FloorCanvasType;
  onSave?: (layout: FloorCanvasType) => void | Promise<void>;
}

export const FloorLayoutEditorView = ({ initialLayout, onSave }: FloorLayoutEditorViewProps): ReactElement => {
  const [state, dispatch] = useReducer(
    layoutHistoryReducer,
    null,
    (): FloorLayoutEditorState => ({
      layout: initialLayout,
      history: [initialLayout],
      historyIndex: 0,
    }),
  );

  const { snapPoint } = useSnapToGrid(GRID_CELL);
  const onBoundsChange = useCallback(
    (id: string, bounds: { x: number; y: number; w: number; h: number; rotation?: number }) => {
      dispatch({ type: "UPDATE_ELEMENT", payload: { id, bounds } });
    },
    [],
  );

  const dragResize = useDragResize({
    onBoundsChange,
    snap: (x, y) => snapPoint(x, y),
    minWidth: GRID_CELL,
    minHeight: GRID_CELL,
  });

  const [addTableCount, setAddTableCount] = useState(0);
  const [addZoneCount, setAddZoneCount] = useState(0);

  useEffect(() => {
    dispatch({ type: "SET_LAYOUT", payload: initialLayout });
  }, [initialLayout]);

  const handleElementPointerDown = useCallback(
    (
      id: string,
      e: React.PointerEvent,
      mode: DragResizeMode,
      bounds: { x: number; y: number; w: number; h: number; rotation?: number },
    ) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragResize.handlePointerDown(id, e, mode, bounds);
    },
    [dragResize],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent): void => {
      dragResize.handlePointerMove(e as unknown as React.PointerEvent);
    };
    const onPointerUp = (): void => dragResize.handlePointerUp();

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerleave", onPointerUp);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onPointerUp);
    };
  }, [dragResize]);

  const addElement = useCallback(
    (toAdd: ElementToAdd) => {
      const el = createElementFromToAdd(toAdd, state.layout.venueId);
      const x = 80 + (state.layout.elements.length % 5) * 100;
      const y = 80 + Math.floor(state.layout.elements.length / 5) * 100;

      dispatch({ type: "ADD_ELEMENT", payload: { element: el, x, y } });
    },
    [state.layout.venueId, state.layout.elements.length],
  );

  const handleAddTable = useCallback(() => {
    setAddTableCount((c) => c + 1);
    addElement({ type: "table", tableNumber: `T${addTableCount + 1}`, seats: 4 });
  }, [addElement, addTableCount]);

  const handleAddZone = useCallback(() => {
    setAddZoneCount((c) => c + 1);
    addElement({ type: "zone", name: `Zone ${addZoneCount + 1}` });
  }, [addElement, addZoneCount]);

  const selectedElement =
    dragResize.selectedId != null ? state.layout.elements.find((el) => el.id === dragResize.selectedId) : null;

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // prettier-ignore
  const ZONE_COLORS = [
    "#FF6B6B", "#FF8E53", "#FFB703", "#FFD166", "#F4E409", "#C9F31D",
    "#90EE02", "#4CD137", "#2ECC71", "#1ABC9C", "#00B894", "#00CEC9",
    "#00A8FF", "#0984E3", "#3C40C6", "#5352ED", "#7D5FFF", "#A55EEA",
    "#C56CF0", "#D980FA", "#E84393", "#FD79A8", "#FF7675", "#E17055",
    "#D35400", "#E67E22", "#F39C12", "#B7950B", "#6AB04C", "#27AE60",
    "#16A085", "#2980B9", "#3742FA", "#6C5CE7", "#8E44AD", "#9B59B6",
    "#C0392B", "#E74C3C", "#FF4757", "#FF6348", "#FFA502", "#2ED573",
  ];

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canUndo}
          onClick={() => dispatch({ type: "UNDO" })}
          aria-label="Undo"
        >
          Undo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canRedo}
          onClick={() => dispatch({ type: "REDO" })}
          aria-label="Redo"
        >
          Redo
        </Button>
        <Button variant="secondary" size="sm" onClick={handleAddTable}>
          Add table
        </Button>
        <Button variant="secondary" size="sm" onClick={handleAddZone}>
          Add zone
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addElement({ type: "bar" })}>
          Add bar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addElement({ type: "wall" })}>
          Add wall
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addElement({ type: "entrance" })}>
          Add entrance
        </Button>
        {onSave && (
          <Button variant="primary" size="sm" onClick={() => void onSave(state.layout)}>
            Save layout
          </Button>
        )}
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-default bg-background-secondary">
          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            <div className="relative" style={{ touchAction: "none" }}>
              <FloorCanvas
                layout={state.layout}
                showGrid
                gridCellSize={GRID_CELL}
                selectedElementId={dragResize.selectedId}
                interactive
                onElementPointerDown={handleElementPointerDown}
                onCanvasBackgroundPointerDown={() => dragResize.setSelectedId(null)}
              />
              {selectedElement && (
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
                        handleElementPointerDown(selectedElement.id, e, mode, {
                          x: selectedElement.x,
                          y: selectedElement.y,
                          w: selectedElement.w,
                          h: selectedElement.h,
                          rotation: selectedElement.rotation,
                        });
                      }}
                      aria-label={`Resize ${mode}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <aside className="w-64 flex-shrink-0 border-l border-border-default bg-surface-primary p-4 flex flex-col gap-3 overflow-auto">
          <h3 className="text-sm font-semibold text-text-primary">Customize</h3>
          {selectedElement ? (
            <>
              {selectedElement.type === "zone" && (
                <>
                  <label className="text-xs text-text-secondary">
                    Name
                    <input
                      type="text"
                      value={selectedElement.name}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, name: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-text-primary"
                    />
                  </label>
                  <label className="text-xs text-text-secondary">
                    Color
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ZONE_COLORS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_ELEMENT",
                              payload: { id: selectedElement.id, color: hex },
                            })
                          }
                          className="h-6 w-6 rounded border-2 border-border-default"
                          style={{ backgroundColor: hex }}
                          aria-label={`Set color ${hex}`}
                          title={hex}
                        />
                      ))}
                    </div>
                  </label>
                </>
              )}
              {selectedElement.type === "table" && (
                <>
                  <label className="text-xs text-text-secondary">
                    Table number
                    <input
                      type="text"
                      value={selectedElement.tableNumber}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, tableNumber: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-text-primary"
                    />
                  </label>
                  <label className="text-xs text-text-secondary">
                    Seats
                    <input
                      type="number"
                      min={1}
                      value={selectedElement.seats}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, seats: Number(e.target.value) || 1 },
                        })
                      }
                      className="mt-1 w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-text-primary"
                    />
                  </label>
                </>
              )}
              {selectedElement.type === "bar" && (
                <label className="text-xs text-text-secondary">
                  Label
                  <input
                    type="text"
                    value={selectedElement.label ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: { id: selectedElement.id, label: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-text-primary"
                  />
                </label>
              )}
              {selectedElement.type === "entrance" && (
                <label className="text-xs text-text-secondary">
                  Label
                  <input
                    type="text"
                    value={selectedElement.label ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: { id: selectedElement.id, label: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-text-primary"
                  />
                </label>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  dispatch({ type: "REMOVE_ELEMENT", payload: { id: selectedElement.id } });
                  dragResize.setSelectedId(null);
                }}
              >
                Remove
              </Button>
            </>
          ) : (
            <p className="text-sm text-text-tertiary">Select an element on the canvas to customize it.</p>
          )}
        </aside>
      </div>
    </div>
  );
};
