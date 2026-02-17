import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const StaffPage = (): ReactElement => {
  return (
    <PageLayout title="Staff Management" description="Manage kitchen, waiter, and other staff accounts">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">Staff Management</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Add staff members and send activation links for kitchen panel, waiter panel, and other apps
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
