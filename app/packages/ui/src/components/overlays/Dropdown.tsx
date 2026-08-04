import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "../../utils";

export type DropdownPlacement =
  "bottom-start" | "bottom-center" | "bottom-end" | "top-start" | "top-center" | "top-end";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  placement?: DropdownPlacement;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
  triggerClassName?: string;
  closeOnSelect?: boolean;
  portal?: boolean;
}

const MENU_GAP_PX = 4;
const VIEWPORT_PAD_PX = 8;

interface DropdownTriggerElementProps {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  "aria-haspopup"?: "menu";
  "aria-expanded"?: boolean;
}

export const Dropdown = ({
  trigger,
  children,
  placement = "bottom-start",
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  triggerClassName,
  closeOnSelect = false,
  portal = false,
}: DropdownProps): ReactElement => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalCoords, setPortalCoords] = useState<{ top: number; left: number } | null>(null);

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

  const updatePortalPosition = useCallback((): void => {
    const trigger = triggerRef.current;
    const menu = dropdownRef.current;

    if (!trigger || !menu || !isOpen || !portal) {
      return;
    }

    const tr = trigger.getBoundingClientRect();
    const { width: mw, height: mh } = menu.getBoundingClientRect();

    if (mw === 0 && mh === 0) {
      return;
    }

    const { left: trLeft, right: trRight, top: trTop, bottom: trBottom, width: trWidth } = tr;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "bottom-end": {
        top = trBottom + MENU_GAP_PX;
        left = trRight - mw;

        break;
      }
      case "bottom-center": {
        top = trBottom + MENU_GAP_PX;
        left = trLeft + trWidth / 2 - mw / 2;

        break;
      }
      case "bottom-start": {
        top = trBottom + MENU_GAP_PX;
        left = trLeft;

        break;
      }
      case "top-end": {
        top = trTop - mh - MENU_GAP_PX;
        left = trRight - mw;

        break;
      }
      case "top-center": {
        top = trTop - mh - MENU_GAP_PX;
        left = trLeft + trWidth / 2 - mw / 2;

        break;
      }
      case "top-start": {
        top = trTop - mh - MENU_GAP_PX;
        left = trLeft;

        break;
      }
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    left = Math.min(Math.max(VIEWPORT_PAD_PX, left), vw - mw - VIEWPORT_PAD_PX);
    top = Math.min(Math.max(VIEWPORT_PAD_PX, top), vh - mh - VIEWPORT_PAD_PX);

    setPortalCoords({ top, left });
  }, [isOpen, placement, portal]);

  useLayoutEffect(() => {
    if (!isOpen || !portal) {
      setPortalCoords(null);

      return;
    }

    updatePortalPosition();
    const frame = requestAnimationFrame(() => {
      updatePortalPosition();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen, portal, updatePortalPosition]);

  useEffect(() => {
    if (!isOpen || !portal) {
      return;
    }

    const menu = dropdownRef.current;

    if (!menu) {
      return;
    }

    const ro = new ResizeObserver(() => {
      updatePortalPosition();
    });

    ro.observe(menu);
    window.addEventListener("scroll", updatePortalPosition, true);
    window.addEventListener("resize", updatePortalPosition);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updatePortalPosition, true);
      window.removeEventListener("resize", updatePortalPosition);
    };
  }, [isOpen, portal, updatePortalPosition]);

  const placementStyles: Record<DropdownPlacement, string> = {
    "bottom-start": "top-full mt-1 start-0",
    "bottom-center": "top-full mt-1 left-1/2 -translate-x-1/2",
    "bottom-end": "top-full mt-1 end-0",
    "top-start": "bottom-full mb-1 start-0",
    "top-center": "bottom-full mb-1 left-1/2 -translate-x-1/2",
    "top-end": "bottom-full mb-1 end-0",
  };

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (!closeOnSelect) {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-dropdown-prevent-close='true']")) {
        return;
      }

      setIsOpen(false);
    },
    [closeOnSelect, setIsOpen],
  );

  const menuClassName = cn(
    "z-dropdown  overflow-hidden rounded-md border border-border-default bg-surface-primary shadow-lg",
    portal ? "fixed" : cn("absolute", placementStyles[placement]),
    className,
  );

  const menuStyle =
    portal && portalCoords
      ? { top: portalCoords.top, left: portalCoords.left }
      : portal
        ? { top: 0, left: 0, visibility: "hidden" as const, pointerEvents: "none" as const }
        : undefined;

  const menu = isOpen ? (
    <div
      ref={dropdownRef}
      className={menuClassName}
      style={menuStyle}
      role="menu"
      aria-orientation="vertical"
      onClick={handleMenuClick}
    >
      {children}
    </div>
  ) : null;

  const renderedTrigger = isValidElement(trigger) ? (
    cloneElement(trigger as ReactElement<DropdownTriggerElementProps>, {
      onClick: (event): void => {
        (trigger as ReactElement<DropdownTriggerElementProps>).props.onClick?.(event);

        if (!event.defaultPrevented) {
          setIsOpen(!isOpen);
        }
      },
      "aria-haspopup": "menu",
      "aria-expanded": isOpen,
    })
  ) : (
    <div
      onClick={(): void => setIsOpen(!isOpen)}
      onKeyDown={handleTriggerKeyDown}
      role="button"
      tabIndex={0}
      aria-haspopup="menu"
      aria-expanded={isOpen}
    >
      {trigger}
    </div>
  );

  return (
    <div className={cn("relative inline-block", triggerClassName)} ref={triggerRef}>
      {renderedTrigger}
      {portal && menu ? createPortal(menu, document.body) : menu}
    </div>
  );
};
