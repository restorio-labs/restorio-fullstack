import { RedirectAuthGuard } from "@restorio/auth";
import { getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminSidebar } from "./components/AdminSidebar";
import { AppLayout } from "./layouts/AppLayout";
import {
  FloorEditorPage,
  MenuCreatorPage,
  MenuPageConfiguratorPage,
  PaymentConfigPage,
  QRCodeGeneratorPage,
  StaffPage,
  VenueCreatorPage,
  VenuesPage,
} from "./pages";

const PUBLIC_WEB_URL: string =
  import.meta.env.VITE_PUBLIC_WEB_URL ?? getAppUrl(getEnvironmentFromEnv(import.meta.env.ENV!), "public-web");

export const App = (): ReactElement => {
  return (
    <RedirectAuthGuard redirectTo={PUBLIC_WEB_URL}>
      <AppLayout sidebar={<AdminSidebar />}>
        <Routes>
          <Route path="/" element={<VenuesPage />} />
          <Route path="/venue-creator" element={<VenueCreatorPage />} />
          <Route path="/venues/:venueId/floor" element={<FloorEditorPage />} />
          <Route path="/menu-creator" element={<MenuCreatorPage />} />
          <Route path="/menu-page-configurator" element={<MenuPageConfiguratorPage />} />
          <Route path="/qr-code-generator" element={<QRCodeGeneratorPage />} />
          <Route path="/payment-config" element={<PaymentConfigPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </RedirectAuthGuard>
  );
};
