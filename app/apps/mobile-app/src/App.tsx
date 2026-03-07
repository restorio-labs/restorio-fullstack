import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { PageLayout } from "@restorio/ui";

import { MobileRail } from "./components/MobileRail";
import { AppLayout } from "./layouts/AppLayout";

const MobileAppWipPage = (): ReactElement => {
  return (
    <PageLayout title="Mobile App [WIP]" description="This surface is not production-ready yet.">
      <div className="p-6">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default text-center">
          <h2 className="text-lg font-medium text-text-secondary">Mobile App [WIP]</h2>
          <p className="mt-2 text-sm text-text-tertiary">This app is not implemented yet and should not be treated as production-ready.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export const App = (): ReactElement => {
  return (
    <AppLayout footer={<MobileRail />}>
      <Routes>
        <Route path="/" element={<MobileAppWipPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};
