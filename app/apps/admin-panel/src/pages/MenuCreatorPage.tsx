import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const MenuCreatorPage = (): ReactElement => {
  return (
    <PageLayout title="Menu Creator" description="Create and manage menus for your restaurants">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">Menu Creator</h2>
          <p className="mt-2 text-sm text-text-tertiary">Design menus with categories, items, and pricing</p>
        </div>
      </div>
    </PageLayout>
  );
};
