import { AuthGuard } from "@restorio/auth";
import type { ReactElement } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { AUTH_REVALIDATE_INTERVAL_MS, PUBLIC_WEB_URL } from "./config";
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
  TenantProfilePage,
  RestaurantQRCodePage,
  StaffPage,
  TableQRCodePage,
} from "./pages";

const AdminShell = (): ReactElement => {
  return (
    <AppLayout sidebar={<AdminSidebar />}>
      <Outlet />
    </AppLayout>
  );
};

export const App = (): ReactElement => {
  return (
    <AuthGuard
      redirectTo={`${PUBLIC_WEB_URL}/login`}
      client={api}
      revalidateIntervalMs={AUTH_REVALIDATE_INTERVAL_MS}
      fallback={<div />}
    >
      <Routes>
        <Route element={<AdminShell />}>
          <Route index element={<FloorEditorPage />} />
          <Route path="restaurant-creator" element={<RestaurantCreatorPage />} />
          <Route path="menu-creator" element={<MenuCreatorPage />} />
          <Route path="main-page-configurator" element={<MenuPageConfiguratorPage />} />
          <Route path="qr-code-generator" element={<QRCodeGeneratorPage />} />
          <Route path="payment-config" element={<PaymentConfigPage />} />
          <Route path="profile" element={<TenantProfilePage />} />
          <Route path="staff" element={<StaffPage />} />
        </Route>
        <Route path="/qr-code/table/:tableId" element={<TableQRCodePage />} />
        <Route path="/qr-code/restaurant" element={<RestaurantQRCodePage />} />
        <Route path="/qr-code/tables" element={<QRCodePrintPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGuard>
  );
};
