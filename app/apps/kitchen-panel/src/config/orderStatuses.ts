import { OrderStatus } from "@restorio/types";

export const statusConfig = {
  [OrderStatus.NEW]: {
    label: "New",
    ariaLabel: "New orders",
    indicatorClassName: "bg-status-info-background border-status-info-border text-status-info-text",
    iconClassName: "text-status-info-text",
    iconKey: "add",
  },
  [OrderStatus.PREPARING]: {
    label: "Preparing",
    ariaLabel: "Preparing orders",
    indicatorClassName: "bg-status-warning-background border-status-warning-border text-status-warning-text",
    iconClassName: "text-status-warning-text",
    iconKey: "clock",
  },
  [OrderStatus.READY]: {
    label: "Ready",
    ariaLabel: "Ready for pickup",
    indicatorClassName: "bg-status-success-background border-status-success-border text-status-success-text",
    iconClassName: "text-status-success-text",
    iconKey: "check",
  },
} as const;
