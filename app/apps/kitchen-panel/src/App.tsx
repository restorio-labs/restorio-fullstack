import { AuthGuard } from "@restorio/auth";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { KitchenRail } from "./components/KitchenRail";
import { AppLayout } from "./layouts/AppLayout";
import { KitchenView } from "./views/KitchenView";
import { LoginView } from "./views/LoginView";
import { MenuAvailabilityView } from "./views/MenuAvailabilityView";

export const App = (): ReactElement => {
  return (
    <AppLayout sidebar={<KitchenRail />}>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/:tenantId"
          element={
            <AuthGuard loginPath="/login" client={api}>
              <KitchenView />
            </AuthGuard>
          }
        />
        <Route
          path="/:tenantId/menu"
          element={
            <AuthGuard loginPath="/login" client={api}>
              <MenuAvailabilityView />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppLayout>
  );
};
