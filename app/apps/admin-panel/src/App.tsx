import { AuthGuard } from "@restorio/auth";
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
const AUTH_REVALIDATE_INTERVAL_MS = (() => {
  const envValue = typeof ENV.VITE_AUTH_REVALIDATE_INTERVAL_MS === "string" ? Number(ENV.VITE_AUTH_REVALIDATE_INTERVAL_MS) : undefined;

  if (Number.isFinite(envValue) && envValue !== undefined && envValue > 0) {
    return envValue;
  }

  return 15 * 60 * 1000; // default to 15 minutes
})();

const AdminShell = (): ReactElement => {
  return (
    <AppLayout sidebar={<AdminSidebar />}>
      <Outlet />
    </AppLayout>
  );
};

export const App = (): ReactElement => {
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      await api.auth.me();

      return true;
    } catch {
      try {
        await api.auth.refresh();
        await api.auth.me();

        return true;
      } catch {
        return false;
      }
    }
  }, []);

  return (
    <AuthGuard
      redirectTo={`${PUBLIC_WEB_URL}/login`}
      checkAuth={checkAuth}
      revalidateIntervalMs={AUTH_REVALIDATE_INTERVAL_MS}
      fallback={<div />}
    >
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
    </AuthGuard>
  );
};
