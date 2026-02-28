import type { CanvasBounds, TableDisplayInfo, TableRuntimeState } from "@restorio/types";
import type { ReactElement } from "react";

import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorTableProps {
  bounds: CanvasBounds;
  tableNumber: number;
  seats: number;
  state?: TableRuntimeState;
  displayInfo?: TableDisplayInfo;
  isSelected?: boolean;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

const stateStyles: Record<TableRuntimeState, string> = {
  free: "bg-surface-primary border-border-default",
  occupied: "bg-interactive-primary/20 border-interactive-primary",
  reserved: "bg-status-warning-background border-status-warning-border",
  dirty: "bg-status-error-background/30 border-status-error-border",
};

const orderStatusLabel: Record<string, string> = {
  browsing: "Browsing",
  ordering: "Ordering",
  ordered: "Ordered",
  preparing: "Preparing",
  served: "Served",
  bill_requested: "Bill",
};

export const FloorTable = ({
  bounds,
  tableNumber,
  seats,
  state = "free",
  displayInfo,
  isSelected = false,
  "aria-label": ariaLabel,
  onPointerDown,
}: FloorTableProps): ReactElement => {
  const guests = displayInfo?.guestCount;
  const orderStatus = displayInfo?.orderStatus;
  const needHelp = displayInfo?.needHelp;
  const label = ariaLabel ?? `Table ${tableNumber}, ${seats} seats, ${state}`;

  return (
    <CanvasElement bounds={bounds} aria-label={label} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 text-text-primary",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-focus",
          stateStyles[state],
          isSelected && "ring-2 ring-border-focus ring-offset-2 ring-offset-background-primary",
        )}
      >
        {needHelp && (
          <span
            className="absolute right-1 top-1 rounded-full bg-status-error-background px-1.5 py-0.5 text-xs font-medium text-status-error-text"
            aria-label="Customer needs help"
            title="Needs help"
          >
            Help
          </span>
        )}
        <span className="font-medium" aria-hidden="true">
          {`Table ${tableNumber}`}
        </span>
        <span className="text-xs text-text-secondary" aria-hidden="true">
          {guests != null ? `${guests}/${seats}` : seats}
        </span>
        {orderStatus && (
          <span className="text-xs text-text-tertiary" aria-hidden="true">
            {orderStatusLabel[orderStatus] ?? orderStatus}
          </span>
        )}
      </div>
    </CanvasElement>
  );
};
