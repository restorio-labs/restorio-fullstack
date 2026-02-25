import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthRouteProvider, useAuthRoute } from "../../../src/providers/AuthRouteProvider";

describe("AuthRouteProvider", () => {
  it("renders children", () => {
    const checkAuth = vi.fn().mockResolvedValue(false);

    render(
      <AuthRouteProvider checkAuth={checkAuth}>
        <div data-testid="child">content</div>
      </AuthRouteProvider>,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- testing-library screen methods
    expect(screen.getByTestId("child")).toBeInTheDocument();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- testing-library screen methods
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("starts with loading then sets anonymous when checkAuth returns false", async () => {
    const checkAuth = vi.fn().mockResolvedValue(false);

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    expect(result.current.authStatus).toBe("loading");

    await waitFor(() => {
      expect(result.current.authStatus).toBe("anonymous");
    });
    expect(checkAuth).toHaveBeenCalledOnce();
  });

  it("sets authenticated when checkAuth returns true", async () => {
    const checkAuth = vi.fn().mockResolvedValue(true);

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    await waitFor(() => {
      expect(result.current.authStatus).toBe("authenticated");
    });
    expect(checkAuth).toHaveBeenCalledOnce();
  });

  it("useAuthRoute throws when used outside provider", () => {
    expect(() => renderHook(() => useAuthRoute())).toThrow("useAuthRoute must be used within AuthRouteProvider");
  });
});
