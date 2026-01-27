import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

import { AuthGuard } from "../../src/guard";
import { TokenStorage } from "../../src/storage";

vi.mock("../../src/storage", () => ({
  TokenStorage: {
    getAccessToken: vi.fn(),
    isAccessTokenValid: vi.fn(),
  },
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when strategy is none", () => {
    render(
      <MemoryRouter>
        <AuthGuard strategy="none">
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should render children when authenticated with valid token", () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("valid-token");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(true);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should redirect to login when token is missing", () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should redirect to login when token is invalid", () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("invalid-token");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should redirect to custom login path when provided", () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthGuard loginPath="/custom-login">
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should use code strategy by default", () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("123-456");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(true);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(TokenStorage.getAccessToken).toHaveBeenCalled();
  });
});
