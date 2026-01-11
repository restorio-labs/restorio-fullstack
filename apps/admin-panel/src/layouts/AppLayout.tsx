import { AppShell } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
}

export const AppLayout = ({ children, header, footer, sidebar }: AppLayoutProps): ReactNode => {
  return (
    <AppShell header={header} footer={footer} sidebar={sidebar}>
      {children}
    </AppShell>
  );
};
