import { AuthGuard, LogoutButton } from "@restorio/auth";
import { Button, Dropdown, PageLayout, ThemeSwitcher, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { api } from "./api/client";
import { AUTH_REVALIDATE_INTERVAL_MS, PUBLIC_WEB_URL } from "./config";
import { AppLayout } from "./layouts/AppLayout";
import { FloorRuntimeView } from "./views/FloorRuntimeView";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
};

interface FloorDashboardPageProps {
  fixedRestaurantId?: string;
}

const FloorDashboardPage = ({ fixedRestaurantId }: FloorDashboardPageProps): ReactElement => {
  const { t } = useI18n();
  const {
    data: restaurants = [],
    isLoading,
    isError,
    error,
    refetch: refetchRestaurants,
    isRefetching: isRefetchingRestaurants,
  } = useQuery({
    queryKey: ["waiter-panel", "tenants"],
    queryFn: () => api.tenants.list(),
  });

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const resolvedRestaurantId = fixedRestaurantId ?? selectedRestaurantId;
  const showRestaurantSelector = !fixedRestaurantId && restaurants.length > 1;

  useEffect(() => {
    if (fixedRestaurantId) {
      setSelectedRestaurantId(fixedRestaurantId);

      return;
    }

    if (restaurants.length === 0) {
      setSelectedRestaurantId(null);

      return;
    }

    if (selectedRestaurantId && restaurants.some((restaurant) => restaurant.id === selectedRestaurantId)) {
      return;
    }

    setSelectedRestaurantId(restaurants[0].id);
  }, [fixedRestaurantId, restaurants, selectedRestaurantId]);

  const selectedRestaurantName = useMemo(() => {
    if (!resolvedRestaurantId) {
      return null;
    }

    return restaurants.find((restaurant) => restaurant.id === resolvedRestaurantId)?.name ?? null;
  }, [resolvedRestaurantId, restaurants]);

  const {
    data: venue,
    isLoading: isVenueLoading,
    isError: isVenueError,
    error: venueError,
    refetch: refetchVenue,
    isRefetching: isRefetchingVenue,
  } = useQuery({
    queryKey: ["waiter-panel", "tenant", resolvedRestaurantId],
    queryFn: () => api.tenants.get(resolvedRestaurantId ?? ""),
    enabled: typeof resolvedRestaurantId === "string" && resolvedRestaurantId.trim() !== "",
  });

  const isRefreshing = isRefetchingRestaurants || isRefetchingVenue;

  useEffect(() => {
    if (!venue || venue.floorCanvases.length === 0) {
      setSelectedFloorId(null);

      return;
    }

    if (selectedFloorId && venue.floorCanvases.some((canvas) => canvas.id === selectedFloorId)) {
      return;
    }

    const defaultFloorId =
      venue.floorCanvases.find((canvas) => canvas.id === venue.activeLayoutVersionId)?.id ?? venue.floorCanvases[0].id;

    setSelectedFloorId(defaultFloorId);
  }, [selectedFloorId, venue]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    await refetchRestaurants();

    if (resolvedRestaurantId) {
      await refetchVenue();
    }
  }, [refetchRestaurants, refetchVenue, resolvedRestaurantId]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await api.auth.logout();
  }, []);

  const activeFloorName = useMemo(() => {
    if (!venue) {
      return t("waiterDashboard.activeFloorNone");
    }

    if (venue.floorCanvases.length === 0) {
      return t("waiterDashboard.activeFloorNoConfigured");
    }

    const activeCanvas = venue.floorCanvases.find((canvas) => canvas.id === selectedFloorId) ?? venue.floorCanvases[0];

    return activeCanvas.name;
  }, [selectedFloorId, t, venue]);

  const selectedRestaurantLabel = useMemo(() => {
    if (!resolvedRestaurantId) {
      return t("waiterDashboard.restaurantLabel");
    }

    return (
      restaurants.find((restaurant) => restaurant.id === resolvedRestaurantId)?.name ??
      t("waiterDashboard.restaurantLabel")
    );
  }, [resolvedRestaurantId, restaurants, t]);

  const floorControl =
    venue && venue.floorCanvases.length > 1 ? (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>{t("waiterDashboard.activeFloorLabel")}</span>
        <Dropdown
          trigger={
            <Button type="button" variant="secondary" size="sm">
              {activeFloorName}
            </Button>
          }
          placement="bottom-start"
          closeOnSelect
        >
          <div className="p-1">
            {venue.floorCanvases.map((canvas) => (
              <button
                key={canvas.id}
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                onClick={() => setSelectedFloorId(canvas.id)}
              >
                {canvas.name}
              </button>
            ))}
          </div>
        </Dropdown>
      </div>
    ) : (
      <div className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm text-text-secondary">
        {t("waiterDashboard.activeFloorLabel")}: {activeFloorName}
      </div>
    );

  const sessionControls = (
    <>
      <ThemeSwitcher />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void handleRefresh();
        }}
        disabled={isLoading || isRefreshing}
      >
        {isRefreshing ? t("waiterDashboard.refreshing") : t("waiterDashboard.refresh")}
      </Button>
      <LogoutButton
        variant="danger"
        size="sm"
        onLogout={handleLogout}
        redirectTo={`${PUBLIC_WEB_URL}/login`}
        loadingLabel={t("waiterDashboard.loggingOut")}
      >
        {t("waiterDashboard.logout")}
      </LogoutButton>
    </>
  );

  const headerActions = (
    <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
      {floorControl}
      {sessionControls}
    </div>
  );

  const mobileControls = (
    <div className="md:hidden flex flex-col gap-2 rounded-lg border border-border-default bg-surface-primary p-3">
      <div className="flex items-center gap-2">{floorControl}</div>
      <div className="flex items-center gap-2">{sessionControls}</div>
    </div>
  );

  return (
    <PageLayout
      title={venue?.name ?? selectedRestaurantName ?? t("waiterDashboard.title")}
      description={t("waiterDashboard.description")}
      headerActions={headerActions}
    >
      <div className="flex h-full min-h-0 flex-col gap-4 p-4">
        {mobileControls}
        {isLoading && <div className="text-sm text-text-tertiary">{t("waiterDashboard.loadingRestaurants")}</div>}
        {isError && (
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {getErrorMessage(error, t("waiterDashboard.loadRestaurantsError"))}
          </div>
        )}
        {!isLoading && !isError && restaurants.length === 0 && (
          <div className="rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-sm text-text-secondary">
            {t("waiterDashboard.noRestaurants")}
          </div>
        )}
        {!isLoading && !isError && showRestaurantSelector && (
          <div className="flex max-w-md items-center gap-3 text-sm text-text-secondary">
            <span>{t("waiterDashboard.restaurantLabel")}</span>
            <Dropdown
              trigger={
                <Button type="button" variant="secondary" className="min-w-[220px] justify-start">
                  {selectedRestaurantLabel}
                </Button>
              }
              placement="bottom-start"
              closeOnSelect
            >
              <div className="p-1">
                {restaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                    onClick={() => setSelectedRestaurantId(restaurant.id)}
                  >
                    {restaurant.name}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        )}
        {!isLoading && !isError && restaurants.length > 0 && isVenueLoading && (
          <div className="text-sm text-text-tertiary">{t("waiterDashboard.loadingFloor")}</div>
        )}
        {!isLoading && !isError && restaurants.length > 0 && isVenueError && (
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {getErrorMessage(venueError, t("waiterDashboard.loadFloorError"))}
          </div>
        )}
        {!isLoading && !isError && restaurants.length > 0 && !isVenueLoading && !isVenueError && venue && (
          <div className="flex-1 min-h-0 rounded-lg border border-border-default bg-background-secondary">
            <FloorRuntimeView venue={venue} selectedFloorId={selectedFloorId} />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

const FloorPage = (): ReactElement => {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  if (!restaurantId) {
    return <Navigate to="/" replace />;
  }

  return <FloorDashboardPage fixedRestaurantId={restaurantId} />;
};

export const App = (): ReactElement => {
  return (
    <AuthGuard
      redirectTo={`${PUBLIC_WEB_URL}/login`}
      client={api}
      revalidateIntervalMs={AUTH_REVALIDATE_INTERVAL_MS}
      fallback={<div />}
    >
      <AppLayout>
        <Routes>
          <Route path="/" element={<FloorDashboardPage />} />
          <Route path="/restaurants/:restaurantId" element={<FloorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </AuthGuard>
  );
};
