/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { PaymentsResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "put">;

describe("PaymentsResource", () => {
  let client: ApiClientMock;
  let resource: PaymentsResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      put: vi.fn().mockResolvedValue(undefined),
    };

    resource = new PaymentsResource(client as ApiClient);
  });

  it("updateP24Config calls PUT /payments/tenants/:id/p24-config and returns response data", async () => {
    const payload = {
      p24_merchantid: 123456,
      p24_api: "api-key",
      p24_crc: "crc-key",
    };

    client.put = vi.fn().mockResolvedValue({ data: payload });

    const result = await resource.updateP24Config("tenant-1", payload);

    expect(client.put).toHaveBeenCalledWith("/payments/tenants/tenant-1/p24-config", payload, { signal: undefined });
    expect(result).toEqual(payload);
  });
});
