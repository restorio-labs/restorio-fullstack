import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { MobileRail } from "./components/MobileRail";
import { AppLayout } from "./layouts/AppLayout";

export const App = (): ReactElement => {
  return (
    <AppLayout footer={<MobileRail />}>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};
