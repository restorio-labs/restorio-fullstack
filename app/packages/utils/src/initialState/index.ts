import type { FloorCanvas } from "@restorio/types";

export const createInitialLayout = (venueId: string, name: string, width: number, height: number): FloorCanvas => ({
  id: `canvas-${venueId}-1`,
  venueId,
  name,
  width,
  height,
  elements: [],
  version: 1,
});
