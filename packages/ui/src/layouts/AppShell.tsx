import type { ReactNode, ReactElement } from "react";

import { cn } from "@utils";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
}

export const AppShell = ({
  children,
  header,
  footer,
  sidebar,
  sidebarPosition = "left",
  className,
}: AppShellProps): ReactElement => {
  return (
    <div className={cn("flex flex-col min-h-screen bg-background-primary", className)}>
      {header && <header className="flex-shrink-0 border-b border-border-default bg-surface-primary">{header}</header>}
      <div className="flex flex-1 overflow-hidden">
        {sidebar && sidebarPosition === "left" && (
          <aside className="flex-shrink-0 border-r border-border-default bg-surface-secondary">{sidebar}</aside>
        )}
        <main className="flex-1 overflow-auto">{children}</main>
        {sidebar && sidebarPosition === "right" && (
          <aside className="flex-shrink-0 border-l border-border-default bg-surface-secondary">{sidebar}</aside>
        )}
      </div>
      {footer && <footer className="flex-shrink-0 border-t border-border-default bg-surface-primary">{footer}</footer>}
    </div>
  );
};
