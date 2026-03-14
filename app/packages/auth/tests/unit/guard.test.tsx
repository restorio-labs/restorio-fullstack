import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

import { AuthGuard, type AuthGuardProps } from "../../src/guard";
import { TokenStorage } from "../../src/storage";

vi.mock("../../src/storage", () => ({
  TokenStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    isAccessTokenValid: vi.fn(),
  },
}));

type AuthClient = NonNullable<AuthGuardProps["client"]>;

const mockClient: AuthClient = {
  auth: {
    me: vi.fn(),
    refresh: vi.fn(),
  },
};

const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when strategy is none", () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
        <AuthGuard strategy="none">
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should render children when authenticated with valid token", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("valid-token");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(true);

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
        <AuthGuard client={mockClient}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Protected Content")).toBeInTheDocument());
  });

  it("should redirect to login when token is missing", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue(null);
    (TokenStorage.getRefreshToken as Mock).mockReturnValue(null);
    (mockClient.auth.me as Mock).mockRejectedValue(new Error("unauthorized"));
    (mockClient.auth.refresh as Mock).mockRejectedValue(new Error("unauthorized"));

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={["/protected"]}>
        <AuthGuard client={mockClient}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Protected Content")).not.toBeInTheDocument());
  });

  it("should redirect to login when token is invalid", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("invalid-token");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(false);
    (TokenStorage.getRefreshToken as Mock).mockReturnValue(null);
    (mockClient.auth.me as Mock).mockRejectedValue(new Error("unauthorized"));
    (mockClient.auth.refresh as Mock).mockRejectedValue(new Error("unauthorized"));

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={["/protected"]}>
        <AuthGuard client={mockClient}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Protected Content")).not.toBeInTheDocument());
  });

  it("should redirect to custom login path when provided", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue(null);
    (TokenStorage.getRefreshToken as Mock).mockReturnValue(null);
    (mockClient.auth.me as Mock).mockRejectedValue(new Error("unauthorized"));
    (mockClient.auth.refresh as Mock).mockRejectedValue(new Error("unauthorized"));

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={["/protected"]}>
        <AuthGuard loginPath="/custom-login" client={mockClient}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Protected Content")).not.toBeInTheDocument());
  });

  it("should use code strategy by default", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("123-456");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(true);

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
        <AuthGuard client={mockClient}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Protected Content")).toBeInTheDocument());
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(TokenStorage.getAccessToken).toHaveBeenCalled();
  });
});
