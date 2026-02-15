/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { VenuesResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("VenuesResource", () => {
  let client: ApiClientMock;
  let resource: VenuesResource;

  beforeEach(() => {
    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new VenuesResource(client as ApiClient);
  });

  it("list calls GET /venues without tenant filter", async () => {
    await resource.list();

    expect(client.get).toHaveBeenCalledWith("/venues", {
      params: undefined,
      signal: undefined,
    });
  });

  it("list calls GET /venues with tenant filter", async () => {
    await resource.list("tenant-1");

    expect(client.get).toHaveBeenCalledWith("/venues", {
      params: { tenant_id: "tenant-1" },
      signal: undefined,
    });
  });

  it("get calls GET /venues/:venueId", async () => {
    await resource.get("venue-1");

    expect(client.get).toHaveBeenCalledWith("/venues/venue-1", { signal: undefined });
  });

  it("create calls POST /venues/:tenantId", async () => {
    await resource.create("tenant-1", { name: "Main Hall" });

    expect(client.post).toHaveBeenCalledWith("/venues/tenant-1", { name: "Main Hall" }, { signal: undefined });
  });

  it("update calls PUT /venues/:venueId", async () => {
    await resource.update("venue-1", { name: "Updated name", activeLayoutVersionId: "canvas-2" });

    expect(client.put).toHaveBeenCalledWith(
      "/venues/venue-1",
      { name: "Updated name", activeLayoutVersionId: "canvas-2" },
      { signal: undefined },
    );
  });

  it("delete calls DELETE /venues/:venueId", async () => {
    await resource.delete("venue-1");

    expect(client.delete).toHaveBeenCalledWith("/venues/venue-1", { signal: undefined });
  });
});
