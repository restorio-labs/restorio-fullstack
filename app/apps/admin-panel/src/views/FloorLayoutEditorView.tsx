import type {
  ElementToAdd,
  FloorCanvas as FloorCanvasType,
  FloorElement,
  FloorLayoutEditorState,
  LayoutHistoryAction,
} from "@restorio/types";
import { Button, Dropdown, FloorCanvas, useDragResize, type DragResizeMode, useI18n, useSnapToGrid, useTheme } from "@restorio/ui";
import type { ReactElement, Reducer } from "react";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { cloneFloorElement, createElementFromToAdd, layoutHistoryReducer } from "../features/floor/floorLayoutState";

const GRID_CELL = 20;
const MIN_CANVAS_WIDTH = 1000;
const MIN_CANVAS_HEIGHT = 800;
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

type ThemeColors = ReturnType<typeof useTheme>["colors"];

const ZONE_COLOR_SELECTORS: Array<(colors: ThemeColors) => string> = [
  (theme) => theme.status.success.background,
  (theme) => theme.status.info.background,
  (theme) => theme.status.warning.background,
  (theme) => theme.status.error.background,
  (theme) => theme.status.success.border,
  (theme) => theme.status.info.border,
  (theme) => theme.status.warning.border,
  (theme) => theme.status.error.border,
  (theme) => theme.interactive.primary,
  (theme) => theme.interactive.primaryHover,
  (theme) => theme.interactive.primaryActive,
  (theme) => theme.interactive.secondary,
  (theme) => theme.interactive.secondaryHover,
  (theme) => theme.interactive.secondaryActive,
  (theme) => theme.interactive.success,
  (theme) => theme.interactive.successHover,
  (theme) => theme.interactive.danger,
  (theme) => theme.interactive.dangerHover,
  (theme) => theme.background.secondary,
  (theme) => theme.background.tertiary,
];

interface FloorLayoutEditorViewProps {
  initialLayout: FloorCanvasType;
  onSave?: (layout: FloorCanvasType) => void | Promise<void>;
}

const ensureMinimumCanvasSize = (layout: FloorCanvasType): FloorCanvasType => ({
  ...layout,
  width: Math.max(layout.width, MIN_CANVAS_WIDTH),
  height: Math.max(layout.height, MIN_CANVAS_HEIGHT),
});

const clampElementBounds = (
  bounds: { x: number; y: number; w: number; h: number; rotation?: number },
  layout: FloorCanvasType,
): { x: number; y: number; w: number; h: number; rotation?: number } => {
  const width = Math.min(Math.max(GRID_CELL, bounds.w), layout.width);
  const height = Math.min(Math.max(GRID_CELL, bounds.h), layout.height);
  const maxX = Math.max(0, layout.width - width);
  const maxY = Math.max(0, layout.height - height);

  return {
    ...bounds,
    w: width,
    h: height,
    x: Math.min(Math.max(0, bounds.x), maxX),
    y: Math.min(Math.max(0, bounds.y), maxY),
  };
};

const isTextEditingTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;

  if (!element) {
    return false;
  }

  const { tagName } = element;

  return element.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
};

const getMaxZIndex = (elements: FloorCanvasType["elements"]): number =>
  elements.reduce((max, el) => Math.max(max, Number(el.zIndex ?? 0)), 0);

const getMinZIndex = (elements: FloorCanvasType["elements"]): number =>
  elements.reduce((min, el) => Math.min(min, Number(el.zIndex ?? 0)), 0);

export const FloorLayoutEditorView = ({ initialLayout, onSave }: FloorLayoutEditorViewProps): ReactElement => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const normalizedInitialLayout = ensureMinimumCanvasSize(initialLayout);
  const [state, dispatch] = useReducer<Reducer<FloorLayoutEditorState, LayoutHistoryAction>>(layoutHistoryReducer, {
    layout: normalizedInitialLayout,
    history: [normalizedInitialLayout],
    historyIndex: 0,
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboardElements, setClipboardElements] = useState<FloorElement[]>([]);
  const [isMultiSelectModifierPressed, setIsMultiSelectModifierPressed] = useState(false);
  const [activeDragMode, setActiveDragMode] = useState<DragResizeMode | null>(null);

  const { snapPoint, snapSize: snapGridSize } = useSnapToGrid(GRID_CELL);
  const onBoundsChange = useCallback(
    (id: string, bounds: { x: number; y: number; w: number; h: number; rotation?: number }) => {
      const clampedBounds = clampElementBounds(bounds, state.layout);
      const currentElement = state.layout.elements.find((element) => element.id === id);

      if (!currentElement) {
        return;
      }

      const isMultiMove = activeDragMode === "move" && selectedIds.length > 1 && selectedIds.includes(id);

      if (!isMultiMove) {
        dispatch({ type: "UPDATE_ELEMENT", payload: { id, bounds: clampedBounds } });

        return;
      }

      const deltaX = clampedBounds.x - currentElement.x;
      const deltaY = clampedBounds.y - currentElement.y;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      selectedIds.forEach((selectedId) => {
        const element = state.layout.elements.find((item) => item.id === selectedId);

        if (!element) {
          return;
        }

        const nextBounds = clampElementBounds(
          {
            x: element.x + deltaX,
            y: element.y + deltaY,
            w: element.w,
            h: element.h,
            rotation: element.rotation,
          },
          state.layout,
        );

        dispatch({ type: "UPDATE_ELEMENT", payload: { id: selectedId, bounds: nextBounds } });
      });
    },
    [activeDragMode, selectedIds, state.layout],
  );

  const dragResize = useDragResize({
    onBoundsChange,
    snap: (x, y) => snapPoint(x, y),
    snapSize: (w, h) => snapGridSize(w, h),
    minWidth: GRID_CELL,
    minHeight: GRID_CELL,
  });
  const { setSelectedId } = dragResize;

  const [addZoneCount, setAddZoneCount] = useState(0);

  const zoneColors = useMemo(() => {
    const palette = ZONE_COLOR_SELECTORS.map((getColor) => getColor(colors)).filter(
      (value): value is string => Boolean(value),
    );

    if (palette.length === 0) {
      return [colors.status.info.background];
    }

    return Array.from(new Set(palette));
  }, [colors]);

  useEffect(() => {
    dispatch({ type: "SET_LAYOUT", payload: ensureMinimumCanvasSize(initialLayout) });
    setSelectedIds([]);
    setSelectedId(null);
  }, [initialLayout, setSelectedId]);

  useEffect(() => {
    setSelectedIds((currentIds) =>
      currentIds.filter((id) => state.layout.elements.some((element) => element.id === id)),
    );
  }, [state.layout.elements]);

  const removeSelectedElements = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }

    selectedIds.forEach((id) => {
      dispatch({ type: "REMOVE_ELEMENT", payload: { id } });
    });

    setSelectedIds([]);
    setSelectedId(null);
  }, [selectedIds, setSelectedId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Control" || e.key === "Meta") {
        setIsMultiSelectModifierPressed(true);
      }

      if (isTextEditingTarget(e.target)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selectedIds.length === 0) {
          return;
        }

        e.preventDefault();
        const selectedSet = new Set(selectedIds);
        const copied = state.layout.elements.filter((element) => selectedSet.has(element.id));

        setClipboardElements(copied);

        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboardElements.length === 0) {
          return;
        }

        e.preventDefault();
        let nextTableNumber = state.layout.elements.reduce((max, element) => {
          if (element.type !== "table") {
            return max;
          }

          return Math.max(max, element.tableNumber);
        }, 0);
        const pasted = clipboardElements.map((element) => {
          const copy = cloneFloorElement(element);
          const withNumber = copy.type === "table" ? { ...copy, tableNumber: ++nextTableNumber } : copy;
          const nextBounds = clampElementBounds(
            {
              x: element.x + Math.round(element.w / 2),
              y: element.y,
              w: withNumber.w,
              h: withNumber.h,
              rotation: withNumber.rotation,
            },
            state.layout,
          );

          return { ...withNumber, ...nextBounds };
        });

        pasted.forEach((element) => {
          dispatch({
            type: "ADD_ELEMENT",
            payload: { element, x: element.x, y: element.y },
          });
        });
        setSelectedIds(pasted.map((element) => element.id));
        setSelectedId(pasted[0]?.id ?? null);

        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0) {
          return;
        }

        e.preventDefault();
        removeSelectedElements();
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      if (e.key === "Control" || e.key === "Meta") {
        setIsMultiSelectModifierPressed(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [clipboardElements, removeSelectedElements, selectedIds, setSelectedId, state.layout]);

  const handleElementPointerDown = useCallback(
    (
      id: string,
      e: React.PointerEvent,
      mode: DragResizeMode,
      bounds: { x: number; y: number; w: number; h: number; rotation?: number },
    ) => {
      if (isMultiSelectModifierPressed && mode !== "move") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && mode === "move") {
        setSelectedIds((currentIds) => {
          const exists = currentIds.includes(id);
          const nextIds = exists ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id];

          setSelectedId(nextIds[0] ?? null);

          return nextIds;
        });

        return;
      }

      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }

      setActiveDragMode(mode);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragResize.handlePointerDown(id, e, mode, bounds);
    },
    [dragResize, isMultiSelectModifierPressed, selectedIds, setSelectedId],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent): void => {
      dragResize.handlePointerMove(e as unknown as React.PointerEvent);
    };
    const onPointerUp = (): void => {
      setActiveDragMode(null);
      dragResize.handlePointerUp();
    };

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
      const el = createElementFromToAdd(toAdd, state.layout.tenantId);
      const x = 80 + (state.layout.elements.length % 5) * 100;
      const y = 80 + Math.floor(state.layout.elements.length / 5) * 100;

      dispatch({ type: "ADD_ELEMENT", payload: { element: el, x, y } });
    },
    [state.layout.tenantId, state.layout.elements.length],
  );

  const handleAddTable = useCallback(() => {
    const nextNumber = state.layout.elements.reduce((max, element) => {
      if (element.type !== "table") {
        return max;
      }

      return Math.max(max, typeof element.tableNumber === "number" ? element.tableNumber : 0);
    }, 0);

    addElement({ type: "table", seats: 4, tableNumber: nextNumber + 1 });
  }, [addElement, state.layout.elements]);

  const handleAddZone = useCallback(() => {
    setAddZoneCount((c) => c + 1);
    const paletteColor = zoneColors[(addZoneCount + zoneColors.length) % zoneColors.length] ?? zoneColors[0];

    addElement({
      type: "zone",
      name: t("floorEditor.zoneName", { number: addZoneCount + 1 }),
      color: paletteColor,
    });
  }, [addElement, addZoneCount, t, zoneColors]);

  const selectedElements = state.layout.elements.filter((el) => selectedIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const hasMultiSelection = selectedIds.length > 1;

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <div className="box-border flex h-full min-h-0 flex-col overflow-hidden pt-4">
      <div className="flex flex-1 min-h-0">
        <aside className="w-32 min-h-0 flex-shrink-0 p-4">
          <div className="flex flex-col gap-2 center">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={!canUndo}
              onClick={() => dispatch({ type: "UNDO" })}
              aria-label={t("floorEditor.toolbar.undo")}
            >
              {t("floorEditor.toolbar.undo")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={!canRedo}
              onClick={() => dispatch({ type: "REDO" })}
              aria-label={t("floorEditor.toolbar.redo")}
            >
              {t("floorEditor.toolbar.redo")}
            </Button>
            {onSave && (
              <Button variant="primary" size="sm" className="w-full" onClick={() => void onSave(state.layout)}>
                {t("floorEditor.toolbar.save")}
              </Button>
            )}
            <Dropdown
              trigger={
                <Button variant="secondary" size="sm" className="w-full">
                  {t("floorEditor.toolbar.add")}
                </Button>
              }
              placement="bottom-start"
              isOpen={isAddOpen}
              onOpenChange={setIsAddOpen}
              className="min-w-[180px]"
            >
              <div className="p-1">
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                  onClick={() => {
                    handleAddTable();
                    setIsAddOpen(false);
                  }}
                >
                  {t("floorEditor.addMenu.table")}
                </button>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                  onClick={() => {
                    handleAddZone();
                    setIsAddOpen(false);
                  }}
                >
                  {t("floorEditor.addMenu.zone")}
                </button>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                  onClick={() => {
                    addElement({ type: "bar" });
                    setIsAddOpen(false);
                  }}
                >
                  {t("floorEditor.addMenu.bar")}
                </button>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                  onClick={() => {
                    addElement({ type: "wall" });
                    setIsAddOpen(false);
                  }}
                >
                  {t("floorEditor.addMenu.wall")}
                </button>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                  onClick={() => {
                    addElement({ type: "entrance" });
                    setIsAddOpen(false);
                  }}
                >
                  {t("floorEditor.addMenu.entrance")}
                </button>
              </div>
            </Dropdown>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-l-lg border border-border-default bg-background-secondary">
          <div className="flex flex-1 items-center justify-center overflow-auto p-2">
            <div className="relative" style={{ touchAction: "none" }}>
              <FloorCanvas
                layout={state.layout}
                showGrid
                gridCellSize={GRID_CELL}
                selectedElementId={selectedElement?.id ?? null}
                interactive
                onElementPointerDown={handleElementPointerDown}
                onCanvasBackgroundPointerDown={() => {
                  setSelectedIds([]);
                  setSelectedId(null);
                }}
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
                        handleElementPointerDown(selectedElement.id, e, mode, {
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
        <aside className="mr-4 flex w-64 min-h-0 flex-shrink-0 flex-col gap-3 overflow-auto rounded-r-lg border-l border-border-default bg-surface-primary p-4">
          <h3 className="text-sm font-semibold text-text-primary">{t("floorEditor.panel.title")}</h3>
          {selectedElement ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-secondary">{t("floorEditor.panel.layer")}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const maxZIndex = getMaxZIndex(state.layout.elements);

                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: { id: selectedElement.id, zIndex: maxZIndex + 1 },
                      });
                    }}
                  >
                    {t("floorEditor.panel.bringToFront")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const minZIndex = getMinZIndex(state.layout.elements);

                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: { id: selectedElement.id, zIndex: minZIndex - 1 },
                      });
                    }}
                  >
                    {t("floorEditor.panel.sendToBack")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: { id: selectedElement.id, zIndex: Number(selectedElement.zIndex ?? 0) + 1 },
                      });
                    }}
                  >
                    {t("floorEditor.panel.forward")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: { id: selectedElement.id, zIndex: Number(selectedElement.zIndex ?? 0) - 1 },
                      });
                    }}
                  >
                    {t("floorEditor.panel.backward")}
                  </Button>
                </div>
              </div>
              {selectedElement.type === "zone" && (
                <>
                  <label className="text-xs text-text-secondary">
                    {t("floorEditor.panel.name")}
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
                    {t("floorEditor.panel.color")}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {zoneColors.map((hex) => (
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
                          aria-label={t("floorEditor.aria.setColor", { color: hex })}
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
                    {t("floorEditor.panel.seats")}
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
                  {t("floorEditor.panel.label")}
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
                  {t("floorEditor.panel.label")}
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
              <Button variant="danger" size="sm" onClick={removeSelectedElements}>
                {t("floorEditor.panel.delete")}
              </Button>
            </>
          ) : hasMultiSelection ? (
            <>
              <p className="text-sm text-text-tertiary">
                {t("floorEditor.panel.multiSelected", { count: selectedIds.length })}
              </p>
              <Button variant="danger" size="sm" onClick={removeSelectedElements}>
                {t("floorEditor.panel.deleteSelected")}
              </Button>
            </>
          ) : isMultiSelectModifierPressed ? (
            <p className="text-sm text-text-tertiary">{t("floorEditor.panel.multiSelectHint")}</p>
          ) : (
            <p className="text-sm text-text-tertiary">{t("floorEditor.panel.selectHint")}</p>
          )}
        </aside>
      </div>
    </div>
  );
};
