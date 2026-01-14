import type { ReactNode, ReactElement } from "react";

import { cn } from "../../../utils";

export type ToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";

export interface ToastContainerProps {
  children: ReactNode;
  position?: ToastPosition;
  className?: string;
}

const positionStyles: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

export const ToastContainer = ({ children, position = "top-right", className }: ToastContainerProps): ReactElement => {
  return (
    <div
      className={cn("fixed z-toast flex flex-col gap-2 pointer-events-none", positionStyles[position], className)}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {children}
    </div>
  );
};
