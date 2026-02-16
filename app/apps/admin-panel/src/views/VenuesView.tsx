import type { VenueSummary } from "@restorio/types";
import { Button } from "@restorio/ui";
import type { ReactElement } from "react";

interface VenuesViewProps {
  venues: VenueSummary[];
  onSelectVenue: (venue: VenueSummary) => void;
  onAddVenue?: () => void;
}

export const VenuesView = ({ venues, onSelectVenue, onAddVenue }: VenuesViewProps): ReactElement => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 pb-4">
        <h2 className="text-xl font-semibold text-text-primary">Venues</h2>
        {onAddVenue && (
          <Button variant="primary" size="sm" onClick={onAddVenue}>
            Add venue
          </Button>
        )}
      </div>
      {venues.length === 0 ? (
        <div className="text-center text-sm text-text-tertiary py-8">No venues found.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {venues.map((venue) => (
            <li key={venue.id}>
              <button
                type="button"
                onClick={() => onSelectVenue(venue)}
                className="w-full rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                aria-label={`Open floor layout for ${venue.name}`}
              >
                <span className="font-medium text-text-primary">{venue.name}</span>
                <span className="ml-2 text-sm text-text-secondary">{venue.floorCanvasCount} floor(s)</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
