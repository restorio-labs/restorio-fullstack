import { AppShell } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export const AppLayout = ({ children, header, footer }: AppLayoutProps): ReactNode => {
  return (
    <AppShell header={header} footer={footer}>
      {children}
    </AppShell>
  );
};
