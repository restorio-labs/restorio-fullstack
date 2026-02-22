import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { PageLayout } from "./layouts/PageLayout";

const RestaurantsPage = (): ReactElement => {
  return (
    <PageLayout title="Floor" description="Waiter floor view">
      <div className="p-6 text-sm text-text-tertiary">Floor runtime is not yet connected to live restaurants.</div>
    </PageLayout>
  );
};

const FloorPage = (): ReactElement => {
  return <Navigate to="/" replace />;
};

export const App = (): ReactElement => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<RestaurantsPage />} />
        <Route path="/restaurants/:restaurantId" element={<FloorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};
