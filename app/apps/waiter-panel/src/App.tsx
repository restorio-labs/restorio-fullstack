import { AppWrapper } from "@restorio/auth";
import type { ReactElement } from "react";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { WaiterTenantSelectView, FloorRestaurantView } from "./views";

export const App = (): ReactElement => {
  return (
    <AppWrapper client={api}>
      <Suspense fallback={<div />}>
        <Routes>
          <Route path="/" element={<WaiterTenantSelectView />} />
          <Route path="/:restaurantId" element={<FloorRestaurantView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppWrapper>
  );
};
