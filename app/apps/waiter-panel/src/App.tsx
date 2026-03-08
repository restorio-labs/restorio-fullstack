import type { TenantSummary } from "@restorio/types";
import { PageLayout } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";

import { api } from "./api/client";
import { AppLayout } from "./layouts/AppLayout";
import { FloorRuntimeView } from "./views/FloorRuntimeView";

const RestaurantsPage = (): ReactElement => {
  const {
    data: restaurants = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["waiter-panel", "tenants"],
    queryFn: () => api.tenants.list(),
  });

  return (
    <PageLayout title="Restaurants" description="Choose a restaurant floor to open in waiter runtime.">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        {isLoading && <div className="text-sm text-text-tertiary">Loading restaurants…</div>}
        {isError && (
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {error instanceof Error && error.message.trim() !== "" ? error.message : "Failed to load restaurants."}
          </div>
        )}
        {!isLoading && !isError && restaurants.length === 0 && (
          <div className="rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-sm text-text-secondary">
            No restaurants are available for this account.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant: TenantSummary) => (
            <Link
              key={restaurant.id}
              to={`/restaurants/${restaurant.id}`}
              className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-card transition-colors hover:border-border-strong"
            >
              <div className="text-base font-semibold text-text-primary">{restaurant.name}</div>
              <div className="mt-1 text-sm text-text-secondary">Slug: {restaurant.slug}</div>
              <div className="mt-2 text-sm text-text-tertiary">Floor canvases: {restaurant.floorCanvasCount}</div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

const FloorPage = (): ReactElement => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const {
    data: venue,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["waiter-panel", "tenant", restaurantId],
    queryFn: () => api.tenants.get(restaurantId ?? ""),
    enabled: typeof restaurantId === "string" && restaurantId.trim() !== "",
  });

  if (!restaurantId) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageLayout title={venue?.name ?? "Restaurant floor"} description="Live waiter floor runtime view.">
      {isLoading && <div className="p-6 text-sm text-text-tertiary">Loading floor runtime…</div>}
      {isError && (
        <div className="p-6">
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {error instanceof Error && error.message.trim() !== "" ? error.message : "Failed to load restaurant floor."}
          </div>
        </div>
      )}
      {!isLoading && !isError && venue && <FloorRuntimeView venue={venue} />}
    </PageLayout>
  );
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
