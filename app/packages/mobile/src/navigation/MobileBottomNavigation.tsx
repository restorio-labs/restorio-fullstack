import { Button, cn } from "@restorio/ui";
import type { ReactElement, ReactNode } from "react";

import type { MobileNavigationViewModel } from "../view-models";

export interface MobileBottomNavigationProps {
  navigation: MobileNavigationViewModel;
  onNavigate?: (itemId: string) => void;
  accessory?: ReactNode;
  disabled?: boolean;
  contained?: boolean;
}

export const MobileBottomNavigation = ({
  navigation,
  onNavigate,
  accessory,
  disabled = false,
  contained = false,
}: MobileBottomNavigationProps): ReactElement => (
  <nav
    className={cn(
      "bottom-0 left-0 right-0 z-10 border-t border-border-default bg-surface-primary/95 px-4 py-3 backdrop-blur-sm",
      contained ? "absolute" : "fixed",
    )}
    aria-label={navigation.ariaLabel}
  >
    <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-2">
      {navigation.items.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={item.active ? "secondary" : "ghost"}
          size="sm"
          disabled={disabled || !onNavigate || item.disabled}
          aria-current={item.active ? "page" : undefined}
          onClick={onNavigate ? (): void => onNavigate(item.id) : undefined}
        >
          {item.label}
        </Button>
      ))}
      {accessory}
    </div>
  </nav>
);
