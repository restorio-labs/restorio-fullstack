import { useEffect, useRef, useState, useCallback, type ReactNode, type ReactElement } from "react";

import { cn } from "../../utils";

export type DropdownPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  placement?: DropdownPlacement;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

export const Dropdown = ({
  trigger,
  children,
  placement = "bottom-start",
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
}: DropdownProps): ReactElement => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (open: boolean): void => {
      if (!isControlled) {
        setInternalIsOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen]);

  const placementStyles: Record<DropdownPlacement, string> = {
    "bottom-start": "top-full mt-1 start-0",
    "bottom-end": "top-full mt-1 end-0",
    "top-start": "bottom-full mb-1 start-0",
    "top-end": "bottom-full mb-1 end-0",
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div
        onClick={(): void => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-dropdown min-w-[200px] bg-surface-primary border border-border-default rounded-md shadow-lg",
            placementStyles[placement],
            className,
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </div>
      )}
    </div>
  );
};
