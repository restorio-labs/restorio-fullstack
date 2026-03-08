import { BaseAppLayout } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
}

export const AppLayout = ({ children, header, footer, sidebar }: AppLayoutProps): ReactNode => {
  return (
    <BaseAppLayout
      header={header}
      footer={footer}
      sidebar={sidebar}
      skipLabel="Skip to main content"
      wrapChildrenInMain
    >
      {children}
    </BaseAppLayout>
  );
};
