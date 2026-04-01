import type { CanvasBounds, TableDisplayInfo, TableRuntimeState } from "@restorio/types";
import type { ReactElement } from "react";

import { useI18n } from "../../providers/I18nProvider";
import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorTableProps {
  bounds: CanvasBounds;
  tableNumber: number;
  seats: number;
  label?: string;
  state?: TableRuntimeState;
  displayInfo?: TableDisplayInfo;
  isSelected?: boolean;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

const stateStyles: Record<TableRuntimeState, string> = {
  free: "bg-status-success-background border-status-success-border",
  occupied: "bg-status-error-background border-status-error-border",
  reserved: "bg-status-warning-background border-status-warning-border",
  dirty: "bg-status-error-background/30 border-status-error-border",
};

export const FloorTable = ({
  bounds,
  tableNumber,
  seats,
  label: tableLabel,
  state = "free",
  displayInfo,
  isSelected = false,
  "aria-label": ariaLabel,
  onPointerDown,
}: FloorTableProps): ReactElement => {
  const { t } = useI18n();
  const needHelp = displayInfo?.needHelp;
  const hasActiveOrder = displayInfo?.orderStatus !== undefined && displayInfo.orderStatus !== "browsing";
  const resolvedState: TableRuntimeState = hasActiveOrder ? "occupied" : state === "free" ? "free" : state;
  const resolvedTableLabel = tableLabel?.trim() ?? t("floorEditor.tableLabel", { number: tableNumber });
  const label = ariaLabel ?? `${resolvedTableLabel}, ${seats} ${t("floorEditor.panel.seats")}, ${resolvedState}`;

  return (
    <CanvasElement bounds={bounds} aria-label={label} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 text-text-primary",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-focus",
          stateStyles[resolvedState],
          isSelected && "ring-2 ring-border-focus ring-offset-2 ring-offset-background-primary",
        )}
      >
        {needHelp && (
          <span
            className="absolute right-1 top-1 rounded-full bg-status-error-background px-1.5 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-medium text-status-error-text"
            aria-label="Customer needs help"
            title="Needs help"
          >
            Help
          </span>
        )}
        <span className="text-xs md:text-sm lg:text-base font-medium" aria-hidden="true">
          {resolvedTableLabel}
        </span>
        <span className="text-[10px] md:text-xs lg:text-sm text-text-secondary" aria-hidden="true">
          {seats}
        </span>
      </div>
    </CanvasElement>
  );
};
