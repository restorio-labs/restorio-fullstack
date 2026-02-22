import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const QRCodeGeneratorPage = (): ReactElement => {
  return (
    <PageLayout title="QR Code Generator" description="Generate QR codes that redirect customers to your menu">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">QR Code Generator</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Create printable QR codes for tables and marketing materials
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
