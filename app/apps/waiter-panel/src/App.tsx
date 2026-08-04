import { AppWrapper, CapabilityGuard } from "@restorio/auth";
import { AuthorizationActions } from "@restorio/types";
import type { ReactElement } from "react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { api } from "./api/client";

const WaiterTenantSelectView = lazy(async () =>
  import("./views/WaiterTenantSelectView").then((module) => ({ default: module.WaiterTenantSelectView })),
);
const FloorRestaurantView = lazy(async () =>
  import("./views/FloorRestaurantView").then((module) => ({ default: module.FloorRestaurantView })),
);

const WaiterTenantRoute = (): ReactElement => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return (
    <CapabilityGuard client={api} tenantId={restaurantId} require={AuthorizationActions.APP_WAITER_ACCESS}>
      <FloorRestaurantView />
    </CapabilityGuard>
  );
};

export const App = (): ReactElement => {
  return (
    <AppWrapper client={api}>
      <Suspense fallback={<div />}>
        <Routes>
          <Route path="/" element={<WaiterTenantSelectView />} />
          <Route path="/:restaurantId" element={<WaiterTenantRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppWrapper>
  );
};
