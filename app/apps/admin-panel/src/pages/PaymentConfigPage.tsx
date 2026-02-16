import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const PaymentConfigPage = (): ReactElement => {
  return (
    <PageLayout title="Payment Configuration" description="Configure Przelewy24 payment provider settings">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">Payment Config</h2>
          <p className="mt-2 text-sm text-text-tertiary">Set up your Przelewy24 payment provider API keys</p>
        </div>
      </div>
    </PageLayout>
  );
};
