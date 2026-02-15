/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { FloorCanvasesResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("FloorCanvasesResource", () => {
  let client: ApiClientMock;
  let resource: FloorCanvasesResource;

  beforeEach(() => {
    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new FloorCanvasesResource(client as ApiClient);
  });

  it("list calls GET /venues/:venueId/canvases", async () => {
    await resource.list("venue-1");

    expect(client.get).toHaveBeenCalledWith("/venues/venue-1/canvases", { signal: undefined });
  });

  it("get calls GET /venues/:venueId/canvases/:canvasId", async () => {
    await resource.get("venue-1", "canvas-1");

    expect(client.get).toHaveBeenCalledWith("/venues/venue-1/canvases/canvas-1", { signal: undefined });
  });

  it("create calls POST /venues/:venueId/canvases", async () => {
    await resource.create("venue-1", {
      name: "Dining Floor",
      width: 1200,
      height: 800,
      elements: [],
    });

    expect(client.post).toHaveBeenCalledWith(
      "/venues/venue-1/canvases",
      {
        name: "Dining Floor",
        width: 1200,
        height: 800,
        elements: [],
      },
      { signal: undefined },
    );
  });

  it("update calls PUT /venues/:venueId/canvases/:canvasId", async () => {
    await resource.update("venue-1", "canvas-1", {
      name: "Dining Floor v2",
      width: 1000,
    });

    expect(client.put).toHaveBeenCalledWith(
      "/venues/venue-1/canvases/canvas-1",
      { name: "Dining Floor v2", width: 1000 },
      { signal: undefined },
    );
  });

  it("delete calls DELETE /venues/:venueId/canvases/:canvasId", async () => {
    await resource.delete("venue-1", "canvas-1");

    expect(client.delete).toHaveBeenCalledWith("/venues/venue-1/canvases/canvas-1", { signal: undefined });
  });
});
