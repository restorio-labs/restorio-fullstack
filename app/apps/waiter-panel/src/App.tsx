import type { Venue } from "@restorio/types";
import type { ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { mockVenues } from "./features/floor/mockVenues";
import { AppLayout } from "./layouts/AppLayout";
import { PageLayout } from "./layouts/PageLayout";
import { FloorRuntimeView } from "./views/FloorRuntimeView";

const VenuesPage = (): ReactElement => {
  const navigate = useNavigate();

  return (
    <PageLayout title="Floor" description="Select a venue">
      <div className="p-6">
        <ul className="flex flex-col gap-2">
          {mockVenues.map((venue) => (
            <li key={venue.id}>
              <button
                type="button"
                onClick={() => navigate(`/venues/${venue.id}`)}
                className="w-full rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                aria-label={`Open floor for ${venue.name}`}
              >
                <span className="font-medium text-text-primary">{venue.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PageLayout>
  );
};

const FloorPage = (): ReactElement => {
  const { venueId } = useParams<{ venueId: string }>();
  const venue = mockVenues.find((v: Venue) => v.id === venueId);
  const navigate = useNavigate();

  if (!venue) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageLayout
      title={venue.name}
      headerActions={
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm font-medium text-interactive-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Back
        </button>
      }
    >
      <FloorRuntimeView venue={venue} />
    </PageLayout>
  );
};

export const App = (): ReactElement => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<VenuesPage />} />
        <Route path="/venues/:venueId" element={<FloorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};
