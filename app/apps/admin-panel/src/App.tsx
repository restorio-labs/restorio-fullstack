import { AUTH_REVALIDATE_INTERVAL_MS, AuthGuard, AUTH_LOGIN_REDIRECT_URL } from "@restorio/auth";
import { lazy, Suspense, type ReactElement } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { AdminSidebar } from "./features/sidebar/AdminSidebar";
import { AppLayout } from "./layouts/AppLayout";

const FloorEditorPage = lazy(async () =>
  import("./pages/FloorEditorPage").then((module) => ({ default: module.FloorEditorPage })),
);
const RestaurantCreatorPage = lazy(async () =>
  import("./pages/RestaurantCreatorPage").then((module) => ({ default: module.RestaurantCreatorPage })),
);
const MenuCreatorPage = lazy(async () =>
  import("./pages/MenuCreatorPage").then((module) => ({ default: module.MenuCreatorPage })),
);
const QRCodeGeneratorPage = lazy(async () =>
  import("./pages/QRCodeGeneratorPage").then((module) => ({ default: module.QRCodeGeneratorPage })),
);
const PaymentConfigPage = lazy(async () =>
  import("./pages/PaymentConfigPage").then((module) => ({ default: module.PaymentConfigPage })),
);
const TenantProfilePage = lazy(async () =>
  import("./pages/TenantProfilePage").then((module) => ({ default: module.TenantProfilePage })),
);
const StaffPage = lazy(async () => import("./pages/StaffPage").then((module) => ({ default: module.StaffPage })));
const TableQRCodePage = lazy(async () =>
  import("./pages/TableQRCodePage").then((module) => ({ default: module.TableQRCodePage })),
);
const RestaurantQRCodePage = lazy(async () =>
  import("./pages/RestaurantQRCodePage").then((module) => ({ default: module.RestaurantQRCodePage })),
);
const QRCodePrintPage = lazy(async () =>
  import("./pages/QRCodePrintPage").then((module) => ({ default: module.QRCodePrintPage })),
);

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
      redirectTo={AUTH_LOGIN_REDIRECT_URL}
      client={api}
      revalidateIntervalMs={AUTH_REVALIDATE_INTERVAL_MS}
      fallback={<div />}
    >
      <Suspense fallback={<div />}>
        <Routes>
          <Route element={<AdminShell />}>
            <Route index element={<FloorEditorPage />} />
            <Route path="restaurant-creator" element={<RestaurantCreatorPage />} />
            <Route path="menu-creator" element={<MenuCreatorPage />} />
            {/* <Route path="main-page-configurator" element={<MenuPageConfiguratorPage />} /> */}
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
      </Suspense>
    </AuthGuard>
  );
};
