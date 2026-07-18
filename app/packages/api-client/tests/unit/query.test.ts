import { describe, expect, it } from "vitest";

import { createFrontendQueryClient } from "../../src/query";

describe("createFrontendQueryClient", () => {
  it("applies the workspace server-state defaults", () => {
    const client = createFrontendQueryClient();

    expect(client.getDefaultOptions()).toMatchObject({
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    });
  });

  it("allows an app to override one default without dropping the others", () => {
    const client = createFrontendQueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    expect(client.getDefaultOptions().queries).toMatchObject({
      staleTime: 30_000,
      gcTime: 300_000,
      retry: false,
      refetchOnWindowFocus: false,
    });
  });
});
