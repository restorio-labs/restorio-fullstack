import { AuthGuard } from "@restorio/auth";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { KitchenPanelView } from "./views/KitchenPanelView";
import { LoginView } from "./views/LoginView";

export const App = (): ReactElement => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/demo-tenant" replace />} />
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/:tenantId"
          element={
            <AuthGuard strategy="code" loginPath="/login">
              <KitchenPanelView />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/demo-tenant" replace />} />
      </Routes>
    </AppLayout>
  );
};
