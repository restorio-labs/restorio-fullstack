import { PageLayout as UIPageLayout, type PageLayoutProps } from "@restorio/ui";
import type { ReactNode } from "react";

export const PageLayout = ({ children, ...props }: PageLayoutProps): ReactNode => {
  return <UIPageLayout {...props}>{children}</UIPageLayout>;
};
