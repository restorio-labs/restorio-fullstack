import { useMemo } from "react";

export interface Restaurant {
  id: string;
  name: string;
  location?: string;
}

interface TenantRestaurantsResult {
  restaurants: readonly Restaurant[];
  defaultRestaurantId: string | null;
}

const tenantRestaurants: Partial<Record<string, readonly Restaurant[]>> = {
  "demo-tenant": [
    { id: "resto-north", name: "Restorio North", location: "North Hall" },
    { id: "resto-east", name: "Restorio East", location: "East Wing" },
  ],
  "single-tenant": [{ id: "resto-main", name: "Restorio Main" }],
};

const getTenantRestaurants = (tenantId: string): readonly Restaurant[] => {
  return tenantRestaurants[tenantId] ?? [];
};

export const useTenantRestaurants = (tenantId: string): TenantRestaurantsResult => {
  const restaurants = useMemo(() => getTenantRestaurants(tenantId), [tenantId]);
  const defaultRestaurantId = restaurants[0]?.id ?? null;

  return { restaurants, defaultRestaurantId };
};
