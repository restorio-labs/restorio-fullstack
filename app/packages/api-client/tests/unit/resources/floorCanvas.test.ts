import { createInitialLayout } from "@restorio/utils";
import { describe, expect, it } from "vitest";

describe("createInitialLayout", () => {
  it("builds a default layout object for a venue", () => {
    const layout = createInitialLayout("venue-42", "Main Room", 1024, 768);

    expect(layout).toEqual({
      id: "canvas-venue-42-1",
      venueId: "venue-42",
      name: "Main Room",
      width: 1024,
      height: 768,
      elements: [],
      version: 1,
    });
  });

  it("creates a fresh elements array per call", () => {
    const first = createInitialLayout("venue-1", "A", 100, 100);
    const second = createInitialLayout("venue-1", "A", 100, 100);

    first.elements.push({
      id: "table-1",
      type: "table",
      x: 10,
      y: 10,
      w: 40,
      h: 40,
      tableNumber: "1",
      seats: 4,
    });

    expect(second.elements).toHaveLength(0);
  });
});
