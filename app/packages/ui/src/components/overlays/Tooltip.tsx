import { useState, type ReactNode, type ReactElement, useRef } from "react";

import { cn } from "../../utils";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  className?: string;
}

export const Tooltip = ({
  content,
  children,
  placement = "top",
  delay = 200,
  className,
}: TooltipProps): ReactElement => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (): void => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const placementStyles: Record<TooltipPlacement, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowStyles: Record<TooltipPlacement, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-surface-overlay",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-surface-overlay",
    left: "left-full top-1/2 -translate-y-1/2 border-l-surface-overlay",
    right: "right-full top-1/2 -translate-y-1/2 border-r-surface-overlay",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-tooltip px-2 py-1 text-sm text-text-inverse bg-surface-overlay rounded-tooltip whitespace-nowrap",
            placementStyles[placement],
            className,
          )}
          role="tooltip"
        >
          {content}
          <div className={cn("absolute w-0 h-0 border-4 border-transparent", arrowStyles[placement])} />
        </div>
      )}
    </div>
  );
};
