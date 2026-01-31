import type { Restaurant } from "@restorio/types";
import { useMemo } from "react";

interface TenantRestaurantsResult {
  restaurants: readonly Restaurant[];
  defaultRestaurantId: string | null;
}

const tenantRestaurants: Partial<Record<string, readonly Restaurant[]>> = {
  "demo-tenant": [
    {
      id: "resto-north",
      tenantId: "demo-tenant",
      name: "Restorio North",
      description: "North Hall Location",
      address: {
        street: "123 North St",
        city: "Demo City",
        postalCode: "12345",
        country: "Demo Country",
      },
      contactInfo: {
        phone: "+1234567890",
        email: "north@restorio.demo",
      },
      openingHours: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "resto-east",
      tenantId: "demo-tenant",
      name: "Restorio East",
      description: "East Wing Location",
      address: {
        street: "456 East Ave",
        city: "Demo City",
        postalCode: "12346",
        country: "Demo Country",
      },
      contactInfo: {
        phone: "+1234567891",
        email: "east@restorio.demo",
      },
      openingHours: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  "single-tenant": [
    {
      id: "resto-main",
      tenantId: "single-tenant",
      name: "Restorio Main",
      address: {
        street: "789 Main St",
        city: "Demo City",
        postalCode: "12347",
        country: "Demo Country",
      },
      contactInfo: {
        email: "main@restorio.demo",
      },
      openingHours: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

const getTenantRestaurants = (tenantId: string): readonly Restaurant[] => {
  return tenantRestaurants[tenantId] ?? [];
};

export const useTenantRestaurants = (tenantId: string): TenantRestaurantsResult => {
  const restaurants = useMemo(() => getTenantRestaurants(tenantId), [tenantId]);
  const defaultRestaurantId = restaurants[0]?.id ?? null;

  return { restaurants, defaultRestaurantId };
};
