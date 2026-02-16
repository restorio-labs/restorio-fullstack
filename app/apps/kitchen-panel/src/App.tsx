import { AuthGuard } from "@restorio/auth";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { KitchenRail } from "./components/KitchenRail";
import { AppLayout } from "./layouts/AppLayout";
import { KitchenView } from "./views/KitchenView";
import { LoginView } from "./views/LoginView";

export const App = (): ReactElement => {
  return (
    <AppLayout sidebar={<KitchenRail />}>
      <Routes>
        <Route path="/" element={<Navigate to="/demo-tenant" replace />} />
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/:tenantId"
          element={
            <AuthGuard strategy="code" loginPath="/login">
              <KitchenView />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/demo-tenant" replace />} />
      </Routes>
    </AppLayout>
  );
};
