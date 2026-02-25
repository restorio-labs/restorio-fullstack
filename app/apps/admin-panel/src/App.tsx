import { RedirectAuthGuard, checkAuthSession } from "@restorio/auth";
import { getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { AdminSidebar } from "./features/sidebar/AdminSidebar";
import { AppLayout } from "./layouts/AppLayout";
import {
  FloorEditorPage,
  MenuCreatorPage,
  MenuPageConfiguratorPage,
  PaymentConfigPage,
  QRCodeGeneratorPage,
  QRCodePrintPage,
  RestaurantCreatorPage,
  StaffPage,
  RestaurantsPage,
} from "./pages";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const envMode = typeof ENV.ENV === "string" ? ENV.ENV : "development";
const publicWebUrlEnv = typeof ENV.VITE_PUBLIC_WEB_URL === "string" ? ENV.VITE_PUBLIC_WEB_URL : undefined;

const PUBLIC_WEB_URL: string = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

const AdminShell = (): ReactElement => {
  return (
    <AppLayout sidebar={<AdminSidebar />}>
      <Outlet />
    </AppLayout>
  );
};

export const App = (): ReactElement => {
  const checkAuth = useCallback((): Promise<boolean> => {
    return checkAuthSession(() => api.auth.me());
  }, []);

  return (
    <RedirectAuthGuard redirectTo={`${PUBLIC_WEB_URL}/login`} checkAuth={checkAuth}>
      <Routes>
        <Route path="/qr-code-generator/:tenantId" element={<QRCodePrintPage />} />
        <Route element={<AdminShell />}>
          <Route path="/" element={<RestaurantsPage />} />
          <Route path="/restaurant-creator" element={<RestaurantCreatorPage />} />
          <Route path="/restaurants/:restaurantId/floor" element={<FloorEditorPage />} />
          <Route path="/menu-creator" element={<MenuCreatorPage />} />
          <Route path="/menu-page-configurator" element={<MenuPageConfiguratorPage />} />
          <Route path="/qr-code-generator" element={<QRCodeGeneratorPage />} />
          <Route path="/payment-config" element={<PaymentConfigPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RedirectAuthGuard>
  );
};
