import { describe, it, expect, beforeEach, vi } from "vitest";

import { TokenStorage } from "../../src/storage";

describe("TokenStorage", () => {
  const mockGetItem = vi.fn();
  const mockSetItem = vi.fn();
  const mockRemoveItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    if (typeof globalThis.window === "undefined") {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    }

    Object.defineProperty(globalThis.window, "localStorage", {
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

  it("should return null if storage is undefined", () => {
    Object.defineProperty(globalThis.window, "localStorage", {
      value: undefined,
      configurable: true,
    });

    TokenStorage.setAccessToken("test");

    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("should clear tokens from localStorage", () => {
    TokenStorage.clearTokens();

    expect(mockRemoveItem).toHaveBeenCalledWith("restorio_access_token");
    expect(mockRemoveItem).toHaveBeenCalledWith("restorio_refresh_token");
  });

  it("should not clear tokens if storage is undefined", () => {
    Object.defineProperty(globalThis.window, "localStorage", {
      value: undefined,
      configurable: true,
    });

    TokenStorage.clearTokens();

    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  it("should decode token", () => {
    const mockToken =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiUmFueSIsImlhdCI6MTczNTYxMzk0M30.EsmYMso6a8Y-HUijYnO3jRJjuS9XLtASxIKB4HQPj_U";

    const decoded = TokenStorage.decodeToken(mockToken);

    expect(decoded).toBeDefined();
    expect(decoded?.sub).toBe("test-user-id");
  });

  it("should set both tokens", () => {
    TokenStorage.setTokens("access", "refresh");
    expect(mockSetItem).toHaveBeenCalledTimes(2);
  });

  it("should return true if token is expired", () => {
    const expiredToken =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiUmFueSIsImlhdCI6MTUxNjIzOTAyMn0.cxeoyZKNyqrTMbGCDKrT8_1qWdO3BHI5iK8YR4CLvCM";

    expect(TokenStorage.isTokenExpired(expiredToken)).toBe(true);
  });

  it("should return false if token is not expired", () => {
    const token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0=.eyJleHAiOjQxMDI0NDQ4MDB9.test-signature-ignored";

    expect(TokenStorage.isTokenExpired(token)).toBe(false);
  });

  it("decodeToken returns null for an invalid token", () => {
    const invalidToken = "this.is.not.valid";
    const result = TokenStorage.decodeToken(invalidToken);

    expect(result).toBeNull();
  });

  it("setRefreshToken does nothing when localStorage is undefined", () => {
    Object.defineProperty(globalThis.window, "localStorage", {
      value: undefined,
      configurable: true,
    });

    TokenStorage.setRefreshToken("refresh-token");

    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("getRefreshToken returns null when localStorage is undefined", () => {
    Object.defineProperty(globalThis.window, "localStorage", {
      value: undefined,
      configurable: true,
    });

    const result = TokenStorage.getRefreshToken();

    expect(result).toBeNull();
  });

  it("getRefreshToken returns value from localStorage", () => {
    mockGetItem.mockReturnValue("refresh-token-value");

    const result = TokenStorage.getRefreshToken();

    expect(mockGetItem).toHaveBeenCalledTimes(1);
    expect(result).toBe("refresh-token-value");
  });

  it("setRefreshToken sets value in localStorage", () => {
    TokenStorage.setRefreshToken("new-refresh-token");

    expect(mockSetItem).toHaveBeenCalledWith("restorio_refresh_token", "new-refresh-token");
  });

  it("isTokenExpired returns true when token has no exp field", () => {
    const tokenWithoutExp = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0=.eyJzdWIiOiJ0ZXN0In0=.test-signature";

    expect(TokenStorage.isTokenExpired(tokenWithoutExp)).toBe(true);
  });

  it("isTokenExpired returns true for invalid token", () => {
    const invalidToken = "invalid.token.here";

    expect(TokenStorage.isTokenExpired(invalidToken)).toBe(true);
  });

  it("isAccessTokenValid returns true for code pattern", () => {
    expect(TokenStorage.isAccessTokenValid("123-456")).toBe(true);
  });

  it("isAccessTokenValid returns false for expired JWT", () => {
    const expiredToken =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiUmFueSIsImlhdCI6MTUxNjIzOTAyMn0.cxeoyZKNyqrTMbGCDKrT8_1qWdO3BHI5iK8YR4CLvCM";

    expect(TokenStorage.isAccessTokenValid(expiredToken)).toBe(false);
  });

  it("isAccessTokenValid returns true for valid JWT", () => {
    const validToken = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0=.eyJleHAiOjQxMDI0NDQ4MDB9.test-signature-ignored";

    expect(TokenStorage.isAccessTokenValid(validToken)).toBe(true);
  });
});
