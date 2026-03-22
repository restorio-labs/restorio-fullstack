import { AUTH_REVALIDATE_INTERVAL_MS, AuthGuard, AUTH_LOGIN_REDIRECT_URL } from "@restorio/auth";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { KitchenRail } from "./components/KitchenRail";
import { TenantRouteGuard } from "./components/TenantRouteGuard";
import { AppLayout } from "./layouts/AppLayout";
import { KitchenView } from "./views/KitchenView";
import { MenuAvailabilityView } from "./views/MenuAvailabilityView";

export const App = (): ReactElement => {
  return (
    <AuthGuard
      redirectTo={AUTH_LOGIN_REDIRECT_URL}
      client={api}
      revalidateIntervalMs={AUTH_REVALIDATE_INTERVAL_MS}
      fallback={<div />}
    >
      <AppLayout sidebar={<KitchenRail />}>
        <Routes>
          <Route path="/:tenantId" element={<TenantRouteGuard />}>
            <Route index element={<KitchenView />} />
            <Route path="menu" element={<MenuAvailabilityView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </AuthGuard>
  );
};
