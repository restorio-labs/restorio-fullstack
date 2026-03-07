import type { FloorCanvas as FloorCanvasType, FloorElement } from "@restorio/types";
import { Button, useI18n } from "@restorio/ui";
import type { Dispatch, ReactElement } from "react";

import type { FloorEditorHistoryAction } from "../floorLayoutState";
import { getMaxZIndex, getMinZIndex } from "../editorShared";

interface FloorEditorInspectorProps {
  layout: FloorCanvasType;
  selectedElement: FloorElement | null;
  selectedIds: string[];
  zoneColors: string[];
  isMultiSelectModifierPressed: boolean;
  dispatch: Dispatch<FloorEditorHistoryAction>;
  onRemoveSelected: () => void;
  className?: string;
}

export const FloorEditorInspector = ({
  layout,
  selectedElement,
  selectedIds,
  zoneColors,
  isMultiSelectModifierPressed,
  dispatch,
  onRemoveSelected,
  className,
}: FloorEditorInspectorProps): ReactElement => {
  const { t } = useI18n();
  const hasMultiSelection = selectedIds.length > 1;

  return (
    <aside
      className={
        className ??
        "flex w-64 min-h-0 flex-shrink-0 flex-col gap-3 overflow-auto rounded-r-lg border-l border border-border-default p-4"
      }
    >
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
                  const maxZIndex = getMaxZIndex(layout.elements);

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
                  const minZIndex = getMinZIndex(layout.elements);

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
              <label className="text-xs text-text-secondary">
                {t("floorEditor.panel.tableCustomLabel")}
                <input
                  type="text"
                  value={selectedElement.label ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_ELEMENT",
                      payload: { id: selectedElement.id, tableLabel: e.target.value },
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
          <Button variant="danger" size="sm" onClick={onRemoveSelected}>
            {t("floorEditor.panel.delete")}
          </Button>
        </>
      ) : hasMultiSelection ? (
        <>
          <p className="text-sm text-text-tertiary">{t("floorEditor.panel.multiSelected", { count: selectedIds.length })}</p>
          <Button variant="danger" size="sm" onClick={onRemoveSelected}>
            {t("floorEditor.panel.deleteSelected")}
          </Button>
        </>
      ) : isMultiSelectModifierPressed ? (
        <p className="text-sm text-text-tertiary">{t("floorEditor.panel.multiSelectHint")}</p>
      ) : (
        <p className="text-sm text-text-tertiary">{t("floorEditor.panel.selectHint")}</p>
      )}
    </aside>
  );
};
