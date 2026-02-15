import type { VenueSummary } from "@restorio/types";
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { PageLayout } from "../layouts/PageLayout";
import { VenuesView } from "../views/VenuesView";

type LoadingState = "loading" | "loaded" | "error";

export const VenuesPage = (): ReactElement => {
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [venues, setVenues] = useState<VenueSummary[]>([]);

  useEffect(() => {
    const fetchVenues = async (): Promise<void> => {
      try {
        const data = await api.venues.list();

        setVenues(data);
        setLoadingState("loaded");
      } catch {
        setLoadingState("error");
      }
    };

    void fetchVenues();
  }, []);

  if (loadingState === "loading") {
    return (
      <PageLayout title="Venues" description="Manage venue floor layouts">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading venues...</div>
        </div>
      </PageLayout>
    );
  }

  if (loadingState === "error") {
    return (
      <PageLayout title="Venues" description="Manage venue floor layouts">
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load venues. Please try again later.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Venues" description="Manage venue floor layouts">
      <VenuesView venues={venues} onSelectVenue={(venue) => navigate(`/venues/${venue.id}/floor`)} />
    </PageLayout>
  );
};
