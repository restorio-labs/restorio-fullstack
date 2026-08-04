import { AUTH_LOGIN_REDIRECT_URL, AppWrapper, CapabilityGuard } from "@restorio/auth";
import { AuthorizationActions, type AuthorizationAction } from "@restorio/types";
import { lazy, Suspense, type ReactElement, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useLocation } from "react-router-dom";

import { api } from "./api/client";
import { useCurrentTenant } from "./context/TenantContext";
import { AdminSidebar } from "./features/sidebar/AdminSidebar";
import { AppLayout } from "./layouts/AppLayout";
import { OnboardingPage } from "./pages/OnboardingPage";

const PublicWebLoginRedirect = (): null => {
  useEffect(() => {
    window.location.replace(AUTH_LOGIN_REDIRECT_URL);
  }, []);

  return null;
};

const FloorEditorPage = lazy(async () =>
  import("./pages/FloorEditorPage").then((module) => ({ default: module.FloorEditorPage })),
);
const RestaurantCreatorPage = lazy(async () =>
  import("./pages/RestaurantCreatorPage").then((module) => ({ default: module.RestaurantCreatorPage })),
);
const MenuCreatorPage = lazy(async () =>
  import("./pages/MenuCreatorPage").then((module) => ({ default: module.MenuCreatorPage })),
);
const MobileConfigurationPage = lazy(async () =>
  import("./pages/MobileConfigurationPage").then((module) => ({ default: module.MobileConfigurationPage })),
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
const AccessGroupsPage = lazy(async () =>
  import("./pages/AccessGroupsPage").then((module) => ({ default: module.AccessGroupsPage })),
);
const TableQRCodePage = lazy(async () =>
  import("./pages/TableQRCodePage").then((module) => ({ default: module.TableQRCodePage })),
);
const RestaurantQRCodePage = lazy(async () =>
  import("./pages/RestaurantQRCodePage").then((module) => ({ default: module.RestaurantQRCodePage })),
);
const QRCodePrintPage = lazy(async () =>
  import("./pages/QRCodePrintPage").then((module) => ({ default: module.QRCodePrintPage })),
);
const TransactionListPage = lazy(async () =>
  import("./pages/TransactionListPage").then((module) => ({ default: module.TransactionListPage })),
);

const AdminShell = (): ReactElement => {
  const { tenants, tenantsState } = useCurrentTenant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const showOnboarding = tenantsState === "loaded" && tenants.length === 0;

    if (showOnboarding && location.pathname !== "/onboarding") {
      void navigate("/onboarding", { replace: true });
    }
  }, [tenantsState, tenants.length, location.pathname, navigate]);

  if (tenantsState === "loaded" && tenants.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppLayout sidebar={<AdminSidebar />}>
      <Outlet />
    </AppLayout>
  );
};

const AdminCapabilityRoute = ({
  action,
  children,
}: {
  action: AuthorizationAction;
  children: ReactElement;
}): ReactElement => {
  const { selectedTenantId } = useCurrentTenant();

  return (
    <CapabilityGuard
      client={api}
      tenantId={selectedTenantId}
      require={[AuthorizationActions.APP_ADMIN_ACCESS, action]}
      fallback={<PublicWebLoginRedirect />}
    >
      {children}
    </CapabilityGuard>
  );
};

export const App = (): ReactElement => {
  return (
    <AppWrapper client={api}>
      <Suspense fallback={<div />}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AdminShell />}>
            <Route
              index
              element={
                <AdminCapabilityRoute action={AuthorizationActions.FLOOR_CANVAS_WRITE}>
                  <FloorEditorPage />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="restaurant-creator"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.TENANT_UPDATE}>
                  <RestaurantCreatorPage />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="menu-creator"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.MENU_WRITE}>
                  <MenuCreatorPage />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="mobile-configuration"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.MOBILE_CONFIG_WRITE}>
                  <MobileConfigurationPage />
                </AdminCapabilityRoute>
              }
            />
            {/* <Route path="main-page-configurator" element={<MenuPageConfiguratorPage />} /> */}
            <Route
              path="qr-code-generator"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.FLOOR_CANVAS_READ}>
                  <QRCodeGeneratorPage />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="payment-config"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.PAYMENT_CONFIG_READ}>
                  <PaymentConfigPage />
                </AdminCapabilityRoute>
              }
            />
            <Route path="profile" element={<Navigate to="/profile/company-contact" replace />} />
            <Route
              path="profile/company-contact"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.PROFILE_UPDATE}>
                  <TenantProfilePage section="company-contact" />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="profile/address-location"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.PROFILE_UPDATE}>
                  <TenantProfilePage section="address-location" />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="profile/owner-contact"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.PROFILE_UPDATE}>
                  <TenantProfilePage section="owner-contact" />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="profile/social-media"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.PROFILE_UPDATE}>
                  <TenantProfilePage section="social-media" />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="staff"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.STAFF_READ}>
                  <StaffPage />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="staff/access-groups"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.ACCESS_GROUP_READ}>
                  <AccessGroupsPage />
                </AdminCapabilityRoute>
              }
            />
            <Route
              path="transactions"
              element={
                <AdminCapabilityRoute action={AuthorizationActions.PAYMENT_TRANSACTION_READ}>
                  <TransactionListPage />
                </AdminCapabilityRoute>
              }
            />
          </Route>
          <Route path="/qr-code/table/:tableId" element={<TableQRCodePage />} />
          <Route path="/qr-code/restaurant" element={<RestaurantQRCodePage />} />
          <Route path="/qr-code/tables" element={<QRCodePrintPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppWrapper>
  );
};
