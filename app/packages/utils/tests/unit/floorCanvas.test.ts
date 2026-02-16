import { describe, expect, it } from "vitest";

import { createInitialLayout } from "@restorio/utils";

describe("createInitialLayout", () => {
  it("creates a default floor canvas for a venue", () => {
    expect(createInitialLayout("venue-1", "Main Hall", 1200, 800)).toEqual({
      id: "canvas-venue-1-1",
      venueId: "venue-1",
      name: "Main Hall",
      width: 1200,
      height: 800,
      elements: [],
      version: 1,
    });
  });

  it("returns a new elements array for each call", () => {
    const first = createInitialLayout("venue-2", "A", 800, 600);
    const second = createInitialLayout("venue-2", "A", 800, 600);

    first.elements.push({
      id: "zone-1",
      type: "zone",
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      name: "Patio",
    });

    expect(second.elements).toHaveLength(0);
  });
});
