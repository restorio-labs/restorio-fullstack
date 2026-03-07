import type { ElementToAdd, FloorCanvas as FloorCanvasType } from "@restorio/types";
import { Button, Dropdown, useI18n } from "@restorio/ui";
import type { Dispatch, ReactElement } from "react";

import type { FloorEditorHistoryAction } from "../floorLayoutState";

interface FloorEditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  layout: FloorCanvasType;
  onSave?: (layout: FloorCanvasType) => void | Promise<void>;
  showSave?: boolean;
  dispatch: Dispatch<FloorEditorHistoryAction>;
  isAddOpen: boolean;
  setIsAddOpen: (open: boolean) => void;
  onAddTable: () => void;
  onAddZone: () => void;
  onAddElement: (toAdd: ElementToAdd) => void;
  className?: string;
  direction?: "row" | "column";
}

export const FloorEditorToolbar = ({
  canUndo,
  canRedo,
  layout,
  onSave,
  showSave = true,
  dispatch,
  isAddOpen,
  setIsAddOpen,
  onAddTable,
  onAddZone,
  onAddElement,
  className,
  direction = "column",
}: FloorEditorToolbarProps): ReactElement => {
  const { t } = useI18n();
  const isRow = direction === "row";

  return (
    <div className={className}>
      <div className={["flex gap-2", isRow ? "flex-row flex-wrap items-center justify-end" : "flex-col"].join(" ")}>
        <Button
          variant="secondary"
          size="sm"
          className={isRow ? "" : "w-full"}
          disabled={!canUndo}
          onClick={() => dispatch({ type: "UNDO" })}
          aria-label={t("floorEditor.toolbar.undo")}
        >
          {t("floorEditor.toolbar.undo")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={isRow ? "" : "w-full"}
          disabled={!canRedo}
          onClick={() => dispatch({ type: "REDO" })}
          aria-label={t("floorEditor.toolbar.redo")}
        >
          {t("floorEditor.toolbar.redo")}
        </Button>
        {onSave && showSave && (
          <Button variant="primary" size="sm" className={isRow ? "" : "w-full"} onClick={() => void onSave(layout)}>
            {t("floorEditor.toolbar.save")}
          </Button>
        )}
        <Dropdown
          trigger={
            <Button variant="secondary" size="sm" className={isRow ? "" : "w-full"}>
              {t("floorEditor.toolbar.add")}
            </Button>
          }
          placement="bottom-end"
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
          className="min-w-[180px]"
        >
          <div className="p-1">
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
              onClick={() => {
                onAddTable();
                setIsAddOpen(false);
              }}
            >
              {t("floorEditor.addMenu.table")}
            </button>
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
              onClick={() => {
                onAddZone();
                setIsAddOpen(false);
              }}
            >
              {t("floorEditor.addMenu.zone")}
            </button>
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
              onClick={() => {
                onAddElement({ type: "bar" });
                setIsAddOpen(false);
              }}
            >
              {t("floorEditor.addMenu.bar")}
            </button>
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
              onClick={() => {
                onAddElement({ type: "wall" });
                setIsAddOpen(false);
              }}
            >
              {t("floorEditor.addMenu.wall")}
            </button>
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
              onClick={() => {
                onAddElement({ type: "entrance" });
                setIsAddOpen(false);
              }}
            >
              {t("floorEditor.addMenu.entrance")}
            </button>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};
