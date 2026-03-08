import { describe, expect, it, vi } from "vitest";

import { checkAuthSession } from "../../src/sessionCheck";

describe("checkAuthSession", () => {
  it("returns true when session check succeeds", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});

    const result = await checkAuthSession(getCurrentSession);

    expect(result).toBe(true);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
  });

  it("returns false when session check fails", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("unauthorized"));

    const result = await checkAuthSession(getCurrentSession);

    expect(result).toBe(false);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
  });

  it("returns false and skips API call when required session hint cookie is missing", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});

    const result = await checkAuthSession(getCurrentSession, { requireSessionHintCookie: "rshc" });

    expect(result).toBe(false);
    expect(getCurrentSession).not.toHaveBeenCalled();
  });

  it("checks session when required session hint cookie is present", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});
    const documentRef = {
      cookie: "foo=1; rshc=1",
    } as Document;

    const result = await checkAuthSession(getCurrentSession, {
      requireSessionHintCookie: "rshc",
      documentRef,
    });

    expect(result).toBe(true);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
  });
});
