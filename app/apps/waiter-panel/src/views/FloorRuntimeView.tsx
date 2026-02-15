import type { TableDisplayInfo, TableRuntimeState, Venue } from "@restorio/types";
import { FloorCanvas } from "@restorio/ui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

interface FloorRuntimeViewProps {
  venue: Venue;
  tableStates?: Record<string, TableRuntimeState>;
  tableDisplayInfo?: Record<string, TableDisplayInfo>;
}

export const FloorRuntimeView = ({
  venue,
  tableStates: initialTableStates = {},
  tableDisplayInfo: initialTableDisplayInfo = {},
}: FloorRuntimeViewProps): ReactElement => {
  const [tableStates] = useState<Record<string, TableRuntimeState>>(initialTableStates);
  const [tableDisplayInfo] = useState<Record<string, TableDisplayInfo>>(() => ({
    "el-1": { guestCount: 2, orderStatus: "ordering", needHelp: true },
    "el-2": { guestCount: 4, orderStatus: "served" },
    ...initialTableDisplayInfo,
  }));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const hasCanvases = venue.floorCanvases.length > 0;

  const activeCanvas = hasCanvases
    ? (venue.floorCanvases.find((c) => c.id === venue.activeLayoutVersionId) ?? venue.floorCanvases[0])
    : undefined;

  const handleElementPointerDown = useCallback((id: string): void => {
    setSelectedElementId((prev) => (prev === id ? null : id));
  }, []);

  if (!activeCanvas) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-text-secondary">
        No floor layout for this venue.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      {selectedElementId && (
        <span className="text-sm text-text-secondary" aria-live="polite">
          Selected table/element
        </span>
      )}
      <div className="flex flex-1 min-h-0 rounded-lg border border-border-default bg-background-secondary overflow-hidden">
        <FloorCanvas
          layout={activeCanvas}
          showGrid={false}
          gridCellSize={20}
          tableStates={tableStates}
          tableDisplayInfo={tableDisplayInfo}
          selectedElementId={selectedElementId}
          centered
          interactive
          onElementPointerDown={(id, e, _mode, _bounds) => {
            e.preventDefault();
            handleElementPointerDown(id);
          }}
        />
      </div>
    </div>
  );
};
