import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const MenuPageConfiguratorPage = (): ReactElement => {
  return (
    <PageLayout title="Page Configurator" description="Configure the components and layout of your venue pages">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">Menu Page Configurator</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Customize how your menu appears to customers on your venue page
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
