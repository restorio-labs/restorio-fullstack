import { describe, it, expect, beforeEach, vi } from "vitest";

import { TokenStorage } from "../../src/storage";

describe("TokenStorage", () => {
  const mockGetItem = vi.fn();
  const mockSetItem = vi.fn();
  const mockRemoveItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - intentionally mocking localStorage for tests
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
      },
      writable: true,
      configurable: true,
    });
  });

  it("should return null when window is undefined", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;

    vi.stubGlobal("window", undefined);
    expect(TokenStorage.getAccessToken()).toBeNull();
    vi.stubGlobal("window", originalWindow);
  });

  it("should get access token from localStorage", () => {
    const mockToken = "test-access-token";

    mockGetItem.mockReturnValue(mockToken);

    expect(TokenStorage.getAccessToken()).toBe(mockToken);
    expect(mockGetItem).toHaveBeenCalledWith("restorio_access_token");
  });

  it("should set access token in localStorage", () => {
    const mockToken = "test-access-token";

    TokenStorage.setAccessToken(mockToken);

    expect(mockSetItem).toHaveBeenCalledWith("restorio_access_token", mockToken);
  });

  it("should clear tokens from localStorage", () => {
    TokenStorage.clearTokens();

    expect(mockRemoveItem).toHaveBeenCalledWith("restorio_access_token");
    expect(mockRemoveItem).toHaveBeenCalledWith("restorio_refresh_token");
  });
});
