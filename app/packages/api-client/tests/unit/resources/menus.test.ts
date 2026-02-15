/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { MenusResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("MenusResource", () => {
  let client: ApiClientMock;
  let resource: MenusResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new MenusResource(client as ApiClient);
  });

  it("list calls GET /restaurants/:id/menus", async () => {
    await resource.list("r1");
    expect(client.get).toHaveBeenCalledWith("/restaurants/r1/menus", { signal: undefined });
  });

  it("get calls GET /restaurants/:id/menus/:menuId", async () => {
    await resource.get("r1", "m1");
    expect(client.get).toHaveBeenCalledWith("/restaurants/r1/menus/m1", { signal: undefined });
  });

  it("create calls POST /restaurants/:id/menus", async () => {
    const payload = { name: "Lunch Menu" };

    await resource.create("r1", payload);
    expect(client.post).toHaveBeenCalledWith("/restaurants/r1/menus", payload, { signal: undefined });
  });

  it("update calls PUT /restaurants/:id/menus/:menuId", async () => {
    const payload = { name: "Updated Menu" };

    await resource.update("r1", "m1", payload);
    expect(client.put).toHaveBeenCalledWith("/restaurants/r1/menus/m1", payload, { signal: undefined });
  });

  it("delete calls DELETE /restaurants/:id/menus/:menuId", async () => {
    await resource.delete("r1", "m1");
    expect(client.delete).toHaveBeenCalledWith("/restaurants/r1/menus/m1", { signal: undefined });
  });
});
