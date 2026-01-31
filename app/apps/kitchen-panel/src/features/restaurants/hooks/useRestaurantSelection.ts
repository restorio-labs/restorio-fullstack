import type { Restaurant } from "@restorio/types";
import { useEffect, useState } from "react";

export interface UseRestaurantSelectionReturn {
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string) => void;
}

export const useRestaurantSelection = (
  tenantId: string,
  restaurants: readonly Restaurant[],
  defaultRestaurantId: string | null,
): UseRestaurantSelectionReturn => {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const storageKey = `kitchen-panel:tenant:${tenantId}:restaurant`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const storedIsValid = stored ? restaurants.some((restaurant) => restaurant.id === stored) : false;
    const fallbackId = restaurants.length === 1 ? (restaurants[0]?.id ?? null) : defaultRestaurantId;
    const nextId = storedIsValid ? stored : fallbackId;

    setSelectedRestaurantId(nextId);

    if (nextId) {
      localStorage.setItem(storageKey, nextId);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [defaultRestaurantId, restaurants, storageKey]);

  const handleSetSelectedRestaurantId = (id: string): void => {
    setSelectedRestaurantId(id);
    localStorage.setItem(storageKey, id);
  };

  return {
    selectedRestaurantId,
    setSelectedRestaurantId: handleSetSelectedRestaurantId,
  };
};
