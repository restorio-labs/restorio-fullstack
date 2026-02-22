/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { AuthResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post">;

describe("AuthResource", () => {
  let client: ApiClientMock;
  let resource: AuthResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
    };

    resource = new AuthResource(client as ApiClient);
  });

  it("login calls POST /auth/login", async () => {
    await resource.login("a@b.com", "pass");
    expect(client.post).toHaveBeenCalledWith(
      "/auth/login",
      {
        email: "a@b.com",
        password: "pass",
      },
      { signal: undefined },
    );
  });

  it("register calls POST /auth/register", async () => {
    const data = {
      email: "new@user.com",
      password: "password",
      restaurant_name: "My Restaurant",
    };

    await resource.register(data);
    expect(client.post).toHaveBeenCalledWith("/auth/register", data, { signal: undefined });
  });

  it("refresh calls POST /auth/refresh", async () => {
    await resource.refresh("some-refresh-token");
    expect(client.post).toHaveBeenCalledWith(
      "/auth/refresh",
      {
        refreshToken: "some-refresh-token",
      },
      { signal: undefined },
    );
  });

  it("refresh without token calls POST /auth/refresh with empty body", async () => {
    await resource.refresh();

    expect(client.post).toHaveBeenCalledWith("/auth/refresh", undefined, { signal: undefined });
  });

  it("me calls GET /auth/me", async () => {
    await resource.me();
    expect(client.get).toHaveBeenCalledWith("/auth/me", { signal: undefined });
  });
});
