/* eslint-disable @typescript-eslint/unbound-method */
import { OrderStatus } from "@restorio/types";
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { OrdersResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "patch">;

describe("OrdersResource", () => {
  let client: ApiClientMock;
  let resource: OrdersResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      patch: vi.fn().mockResolvedValue(undefined),
    };

    resource = new OrdersResource(client as ApiClient);
  });

  it("list calls GET /restaurants/:id/orders", async () => {
    await resource.list("r1");
    expect(client.get).toHaveBeenCalledWith("/restaurants/r1/orders", {
      params: undefined,
      signal: undefined,
    });
  });

  it("get calls GET /restaurants/:id/orders/:orderId", async () => {
    await resource.get("r1", "o1");
    expect(client.get).toHaveBeenCalledWith("/restaurants/r1/orders/o1", { signal: undefined });
  });

  it("create calls POST /restaurants/:id/orders", async () => {
    const payload = { total: 100 };

    await resource.create("r1", payload);
    expect(client.post).toHaveBeenCalledWith("/restaurants/r1/orders", payload, { signal: undefined });
  });

  it("updateStatus calls PATCH /restaurants/:id/orders/:id/status", async () => {
    await resource.updateStatus("r1", "o1", OrderStatus.CONFIRMED);
    expect(client.patch).toHaveBeenCalledWith(
      "/restaurants/r1/orders/o1/status",
      { status: OrderStatus.CONFIRMED },
      { signal: undefined },
    );
  });
});
