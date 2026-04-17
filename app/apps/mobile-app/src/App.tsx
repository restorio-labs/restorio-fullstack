import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { MobileDeviceGate } from "./components/MobileDeviceGate";
import { AppLayout } from "./layouts/AppLayout";
import { OrderPage } from "./pages/OrderPage";
import { PaymentReturnPage } from "./pages/PaymentReturnPage";
import { RootRedirectPage } from "./pages/RootRedirectPage";
import { TablesLookupPage } from "./pages/TablesLookupPage";
import { TenantLandingPage } from "./pages/TenantLandingPage";
import { TenantMenuPage } from "./pages/TenantMenuPage";

export const App = (): ReactElement => {
  return (
    <MobileDeviceGate>
      <AppLayout>
        <Routes>
          <Route path="/" element={<RootRedirectPage />} />
          <Route path="/payment/return" element={<PaymentReturnPage />} />
          <Route path="/:tenantSlug/table/:tableNumber" element={<OrderPage />} />
          <Route path="/:tenantSlug/tables" element={<TablesLookupPage />} />
          <Route path="/:tenantSlug/menu" element={<TenantMenuPage />} />
          <Route path="/:tenantSlug" element={<TenantLandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </MobileDeviceGate>
  );
};
