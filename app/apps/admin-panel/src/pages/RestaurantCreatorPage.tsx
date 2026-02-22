import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const RestaurantCreatorPage = (): ReactElement => {
  return (
    <PageLayout title="Restaurant Creator" description="Create and configure new restaurants">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">Restaurant Creator</h2>
          <p className="mt-2 text-sm text-text-tertiary">Create new restaurants for your business</p>
        </div>
      </div>
    </PageLayout>
  );
};
