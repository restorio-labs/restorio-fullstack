import { createInitialLayout } from "@restorio/types";
import type { Venue } from "@restorio/types";

export const mockVenues: Venue[] = [
  {
    id: "venue-1",
    tenantId: "tenant-1",
    name: "Main Restaurant",
    activeLayoutVersionId: "canvas-venue-1-1",
    floorCanvases: [
      {
        ...createInitialLayout("venue-1", "Main Hall", 800, 600),
        elements: [
          {
            id: "el-1",
            type: "table",
            x: 80,
            y: 80,
            w: 80,
            h: 80,
            tableNumber: "1",
            seats: 2,
          },
          {
            id: "el-2",
            type: "table",
            x: 200,
            y: 80,
            w: 100,
            h: 80,
            tableNumber: "2",
            seats: 4,
          },
          {
            id: "el-3",
            type: "bar",
            x: 0,
            y: 250,
            w: 120,
            h: 60,
            label: "Bar",
          },
          {
            id: "el-4",
            type: "zone",
            x: 400,
            y: 40,
            w: 350,
            h: 200,
            name: "Terrace",
          },
          {
            id: "el-5",
            type: "entrance",
            x: 360,
            y: 0,
            w: 80,
            h: 40,
            label: "Entrance",
          },
        ],
      },
    ],
  },
  {
    id: "venue-2",
    tenantId: "tenant-1",
    name: "Terrace Only",
    activeLayoutVersionId: null,
    floorCanvases: [createInitialLayout("venue-2", "Outdoor", 600, 400)],
  },
];
