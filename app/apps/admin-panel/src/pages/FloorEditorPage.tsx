import type { FloorCanvas as FloorCanvasType, Venue } from "@restorio/types";
import { useEffect, useState, type ReactElement } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { PageLayout } from "../layouts/PageLayout";
import { FloorLayoutEditorView } from "../views/FloorLayoutEditorView";

type LoadingState = "loading" | "loaded" | "error" | "not-found";

const getActiveCanvas = (venue: Venue): FloorCanvasType | undefined => {
  const canvases = venue.floorCanvases;

  if (canvases.length === 0) {
    return undefined;
  }

  return canvases.find((c) => c.id === venue.activeLayoutVersionId) ?? canvases[0];
};

export const FloorEditorPage = (): ReactElement => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();

  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [venue, setVenue] = useState<Venue | null>(null);

  useEffect(() => {
    if (!venueId) {
      setLoadingState("not-found");

      return;
    }

    const fetchVenue = async (): Promise<void> => {
      if (!venueId) {
        setLoadingState("not-found");

        return;
      }

      try {
        const data = await api.venues.get(venueId);

        setVenue(data);
        setLoadingState("loaded");
      } catch (error) {
        const httpError = error as { response?: { status?: number } };

        if (httpError.response?.status === 404) {
          setLoadingState("not-found");
        } else {
          setLoadingState("error");
        }
      }
    };
  }, [venueId]);

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="text-sm font-medium text-interactive-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
    >
      Back to venues
    </button>
  );

  if (loadingState === "loading") {
    return (
      <PageLayout title="Floor layout" description="Loading..." headerActions={headerActions}>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading venue...</div>
        </div>
      </PageLayout>
    );
  }

  if (loadingState === "not-found" || !venue) {
    return <Navigate to="/" replace />;
  }

  if (loadingState === "error") {
    return (
      <PageLayout title="Floor layout" description="Error" headerActions={headerActions}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load venue. Please try again later.
        </div>
      </PageLayout>
    );
  }

  const hasCanvases = venue.floorCanvases.length > 0;
  const activeCanvas = hasCanvases ? getActiveCanvas(venue) : undefined;

  if (!hasCanvases || activeCanvas === undefined) {
    return (
      <PageLayout title="Floor layout" description={venue.name} headerActions={headerActions}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          No saved floor layouts exist for this venue yet. Add one from the venues list or contact support if you
          believe this is an error.
        </div>
      </PageLayout>
    );
  }

  const handleSave = async (layout: FloorCanvasType): Promise<void> => {
    try {
      await api.floorCanvases.update(venue.id, activeCanvas.id, {
        name: layout.name,
        width: layout.width,
        height: layout.height,
        elements: layout.elements,
      });
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  return (
    <PageLayout title={`Floor: ${activeCanvas.name}`} description={venue.name} headerActions={headerActions}>
      <FloorLayoutEditorView initialLayout={activeCanvas} onSave={handleSave} />
    </PageLayout>
  );
};
