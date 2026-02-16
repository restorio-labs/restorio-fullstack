/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { CanvasBounds } from "@restorio/types";
import { useCallback, useRef, useState } from "react";

export type DragResizeMode =
  | "move"
  | "resize-n"
  | "resize-s"
  | "resize-e"
  | "resize-w"
  | "resize-ne"
  | "resize-nw"
  | "resize-se"
  | "resize-sw";

interface DragState {
  id: string;
  mode: DragResizeMode;
  startX: number;
  startY: number;
  startBounds: CanvasBounds;
}

export interface UseDragResizeOptions {
  onBoundsChange?: (id: string, bounds: CanvasBounds) => void;
  snap?: (x: number, y: number) => { x: number; y: number };
  snapSize?: (w: number, h: number) => { w: number; h: number };
  minWidth?: number;
  minHeight?: number;
}

export interface UseDragResizeReturn {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  isDragging: boolean;
  isResizing: boolean;
  handlePointerDown: (id: string, e: React.PointerEvent, mode: DragResizeMode, currentBounds: CanvasBounds) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
}

const defaultSnap = (x: number, y: number): { x: number; y: number } => ({ x, y });

const defaultSnapSize = (w: number, h: number): { w: number; h: number } => ({ w, h });

export const useDragResize = (options: UseDragResizeOptions = {}): UseDragResizeReturn => {
  const { onBoundsChange, snap = defaultSnap, snapSize = defaultSnapSize, minWidth = 40, minHeight = 40 } = options;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent, mode: DragResizeMode, currentBounds: CanvasBounds): void => {
      e.preventDefault();
      setSelectedId(id);
      const isMove = mode === "move";

      setIsDragging(isMove);
      setIsResizing(!isMove);
      const newState: DragState = {
        id,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        startBounds: currentBounds,
      };

      dragStateRef.current = newState;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent): void => {
      const state: DragState | null = dragStateRef.current;

      if (!state) {
        return;
      }

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const { id } = state;
      const { mode } = state;
      const { startBounds } = state;

      if (mode === "move") {
        const snapped = snap(startBounds.x + dx, startBounds.y + dy);

        onBoundsChange?.(id, { ...startBounds, x: snapped.x, y: snapped.y });

        return;
      }

      const startX = startBounds.x;
      const startY = startBounds.y;
      const startW = startBounds.w;
      const startH = startBounds.h;
      let x = startX;
      let y = startY;
      let w = startW;
      let h = startH;

      switch (mode) {
        case "resize-e":
          w = Math.max(minWidth, startW + dx);

          break;
        case "resize-w":
          w = Math.max(minWidth, startW - dx);
          x = startX + dx;

          break;
        case "resize-s":
          h = Math.max(minHeight, startH + dy);

          break;
        case "resize-n":
          h = Math.max(minHeight, startH - dy);
          y = startY + dy;

          break;
        case "resize-se":
          w = Math.max(minWidth, startW + dx);
          h = Math.max(minHeight, startH + dy);

          break;
        case "resize-sw":
          w = Math.max(minWidth, startW - dx);
          x = startX + dx;
          h = Math.max(minHeight, startH + dy);

          break;
        case "resize-ne":
          w = Math.max(minWidth, startW + dx);
          h = Math.max(minHeight, startH - dy);
          y = startY + dy;

          break;
        case "resize-nw":
          w = Math.max(minWidth, startW - dx);
          x = startX + dx;
          h = Math.max(minHeight, startH - dy);
          y = startY + dy;

          break;
        default:
          return;
      }

      const snapped = snapSize(w, h);
      const { rotation } = startBounds;

      onBoundsChange?.(id, {
        x,
        y,
        w: snapped.w,
        h: snapped.h,
        rotation,
      });
    },
    [minWidth, minHeight, snap, snapSize, onBoundsChange],
  );

  const handlePointerUp = useCallback((): void => {
    dragStateRef.current = null;
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  return {
    selectedId,
    setSelectedId,
    isDragging,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
};
