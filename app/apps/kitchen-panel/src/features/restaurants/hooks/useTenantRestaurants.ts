import type { Restaurant } from "@restorio/types";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../../api/client";

interface TenantRestaurantsResult {
  restaurants: readonly Restaurant[];
  defaultRestaurantId: string | null;
  isLoading: boolean;
}

export const useTenantRestaurants = (_tenantId: string): TenantRestaurantsResult => {
  const { data, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.restaurants.list(),
  });

  const restaurants: readonly Restaurant[] = (data as Restaurant[] | undefined) ?? [];
  const defaultRestaurantId = restaurants[0]?.id ?? null;

  return { restaurants, defaultRestaurantId, isLoading };
};
