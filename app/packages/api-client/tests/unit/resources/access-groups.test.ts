/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { AccessGroupsResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("AccessGroupsResource", () => {
  let client: ApiClientMock;
  let resource: AccessGroupsResource;

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    resource = new AccessGroupsResource(client as ApiClient);
  });

  it("lists tenant access groups", async () => {
    client.get = vi.fn().mockResolvedValue({ data: [{ id: "group-1", name: "Shift leads" }] });

    const result = await resource.list("tenant/one");

    expect(client.get).toHaveBeenCalledWith("/tenants/tenant%2Fone/access-groups", { signal: undefined });
    expect(result).toEqual([{ id: "group-1", name: "Shift leads" }]);
  });

  it("creates a group with the selected capabilities", async () => {
    const input = {
      name: "Shift leads",
      description: null,
      capabilities: ["menu.availability.update"],
    };
    client.post = vi.fn().mockResolvedValue({ data: { id: "group-1", ...input } });

    const result = await resource.create("tenant-1", input);

    expect(client.post).toHaveBeenCalledWith("/tenants/tenant-1/access-groups", input, { signal: undefined });
    expect(result).toEqual({ id: "group-1", ...input });
  });

  it("updates and deletes a group", async () => {
    const input = { name: "Leads", capabilities: ["order.refund"] };
    client.put = vi.fn().mockResolvedValue({ data: { id: "group/1", ...input } });

    await resource.update("tenant-1", "group/1", input);
    await resource.delete("tenant-1", "group/1");

    expect(client.put).toHaveBeenCalledWith("/tenants/tenant-1/access-groups/group%2F1", input, {
      signal: undefined,
    });
    expect(client.delete).toHaveBeenCalledWith("/tenants/tenant-1/access-groups/group%2F1", {
      signal: undefined,
    });
  });

  it("assigns and unassigns an employee", async () => {
    await resource.assign("tenant-1", "group-1", "employee/1");
    await resource.unassign("tenant-1", "group-1", "employee/1");

    const path = "/tenants/tenant-1/access-groups/group-1/members/employee%2F1";
    expect(client.put).toHaveBeenCalledWith(path, undefined, { signal: undefined });
    expect(client.delete).toHaveBeenCalledWith(path, { signal: undefined });
  });
});
