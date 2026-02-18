import type { FloorCanvas as FloorCanvasType, TenantSummary } from "@restorio/types";
import { Button, FloorCanvas } from "@restorio/ui";
import type { ReactElement } from "react";

interface VenuesViewProps {
  venues: TenantSummary[];
  activeCanvasesByVenueId?: Record<string, FloorCanvasType | null>;
  onSelectVenue: (venue: TenantSummary) => void;
  onAddVenue?: () => void;
}

const PREVIEW_WIDTH = 180;
const PREVIEW_HEIGHT = 120;

const getPreviewTransform = (layout: FloorCanvasType): string => {
  const scaleX = PREVIEW_WIDTH / layout.width;
  const scaleY = PREVIEW_HEIGHT / layout.height;
  const scale = Math.min(scaleX, scaleY);

  return `scale(${scale})`;
};

export const VenuesView = ({
  venues,
  activeCanvasesByVenueId = {},
  onSelectVenue,
  onAddVenue,
}: VenuesViewProps): ReactElement => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 pb-4">
        <Button variant="primary" size="sm" onClick={onAddVenue}>
          Add venue
        </Button>
      </div>
      {venues.length === 0 ? (
        <div className="text-center text-sm text-text-tertiary py-8">No venues found.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {venues.map((venue) => {
            const activeCanvas = activeCanvasesByVenueId[venue.id];

            return (
              <li key={venue.id}>
                <button
                  type="button"
                  onClick={() => onSelectVenue(venue)}
                  className="w-full rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  aria-label={`Open floor layout for ${venue.name}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <span className="font-medium text-text-primary">{venue.name}</span>
                      <span className="ml-2 text-sm text-text-secondary">{venue.floorCanvasCount} floor(s)</span>
                    </div>
                    {activeCanvas && (
                      <div className="h-[120px] w-[180px] overflow-hidden rounded-md border border-border-default bg-background-secondary">
                        <FloorCanvas
                          layout={activeCanvas}
                          showGrid={false}
                          interactive={false}
                          centered
                          transformStyle={getPreviewTransform(activeCanvas)}
                        />
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
