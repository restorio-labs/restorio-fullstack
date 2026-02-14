import { AppShell } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export const AppLayout = ({ children, header, footer }: AppLayoutProps): ReactNode => {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-interactive-primary focus:text-text-inverse focus:rounded-button focus-visible-ring focus:block focus:not-sr-only"
      >
        Skip to main content
      </a>
      <AppShell header={header} footer={footer}>
        <main id="main-content">{children}</main>
      </AppShell>
    </>
  );
};
