import { RedirectAuthGuard } from "@restorio/auth";
import { getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminSidebar } from "./features/sidebar/AdminSidebar";
import { AppLayout } from "./layouts/AppLayout";
import {
  FloorEditorPage,
  MenuCreatorPage,
  MenuPageConfiguratorPage,
  PaymentConfigPage,
  QRCodeGeneratorPage,
  RestaurantCreatorPage,
  StaffPage,
  RestaurantsPage,
} from "./pages";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const envMode = typeof ENV.ENV === "string" ? ENV.ENV : "development";
const publicWebUrlEnv = typeof ENV.VITE_PUBLIC_WEB_URL === "string" ? ENV.VITE_PUBLIC_WEB_URL : undefined;
const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;

const PUBLIC_WEB_URL: string = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");
const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";

export const App = (): ReactElement => {
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return (
    <RedirectAuthGuard redirectTo={`${PUBLIC_WEB_URL}/login`} checkAuth={checkAuth}>
      <AppLayout sidebar={<AdminSidebar />}>
        <Routes>
          <Route path="/" element={<RestaurantsPage />} />
          <Route path="/restaurant-creator" element={<RestaurantCreatorPage />} />
          <Route path="/restaurants/:restaurantId/floor" element={<FloorEditorPage />} />
          <Route path="/menu-creator" element={<MenuCreatorPage />} />
          <Route path="/menu-page-configurator" element={<MenuPageConfiguratorPage />} />
          <Route path="/qr-code-generator" element={<QRCodeGeneratorPage />} />
          <Route path="/payment-config" element={<PaymentConfigPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/stuff" element={<StaffPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </RedirectAuthGuard>
  );
};
