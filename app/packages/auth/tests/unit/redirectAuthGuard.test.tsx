import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RedirectAuthGuard } from "../../src/RedirectAuthGuard";

const tokenStorageMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(),
  isAccessTokenValid: vi.fn<(token: string) => boolean>(),
}));

vi.mock("../../src/storage", () => ({
  TokenStorage: {
    getAccessToken: tokenStorageMocks.getAccessToken,
    isAccessTokenValid: tokenStorageMocks.isAccessTokenValid,
  },
}));

describe("RedirectAuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost/",
      },
      writable: true,
      configurable: true,
    });
  });

  it("renders children when access token is valid", async () => {
    tokenStorageMocks.getAccessToken.mockReturnValue("valid-token");
    tokenStorageMocks.isAccessTokenValid.mockReturnValue(true);

    render(
      <RedirectAuthGuard redirectTo="/login">
        <div>Protected content</div>
      </RedirectAuthGuard>,
    );

    expect(await screen.findByText("Protected content")).toBeTruthy();
    expect(tokenStorageMocks.getAccessToken).toHaveBeenCalledTimes(1);
    expect(tokenStorageMocks.isAccessTokenValid).toHaveBeenCalledWith("valid-token");
  });

  it("redirects and renders nothing when token is missing", async () => {
    tokenStorageMocks.getAccessToken.mockReturnValue(null);

    const { container } = render(
      <RedirectAuthGuard redirectTo="/login">
        <div>Protected content</div>
      </RedirectAuthGuard>,
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(container.childElementCount).toBe(0);
    expect(tokenStorageMocks.isAccessTokenValid).not.toHaveBeenCalled();
  });

  it("redirects when token exists but is invalid", async () => {
    tokenStorageMocks.getAccessToken.mockReturnValue("invalid-token");
    tokenStorageMocks.isAccessTokenValid.mockReturnValue(false);

    render(
      <RedirectAuthGuard redirectTo="/auth/sign-in">
        <div>Protected content</div>
      </RedirectAuthGuard>,
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });
});
