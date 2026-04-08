import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { MobileDeviceGate } from "./components/MobileDeviceGate";
import { AppLayout } from "./layouts/AppLayout";
import { OrderPage } from "./pages/OrderPage";
import { PaymentReturnPage } from "./pages/PaymentReturnPage";

export const App = (): ReactElement => {
  return (
    <MobileDeviceGate>
      <AppLayout>
        <Routes>
          <Route path="/:tenantSlug/table/:tableNumber" element={<OrderPage />} />
          <Route path="/payment/return" element={<PaymentReturnPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </MobileDeviceGate>
  );
};
