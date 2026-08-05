import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CapabilityGuard, useCan } from "../../src/CapabilityGuard";

const AllowedContent = (): ReactElement => {
  const canWriteMenu = useCan("menu.write");
  return <div>{canWriteMenu ? "Menu editor" : "Read only"}</div>;
};

describe("CapabilityGuard", () => {
  it("renders and exposes capabilities when the required action is granted", async () => {
    const capabilities = vi.fn().mockResolvedValue({
      tenant_id: "tenant-a",
      policy_version: "test-policy",
      capabilities: ["menu.read", "menu.write"],
    });

    render(
      <MemoryRouter>
        <CapabilityGuard client={{ tenants: { capabilities } }} tenantId="tenant-a" require="menu.write">
          <AllowedContent />
        </CapabilityGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Menu editor")).toBeInTheDocument());
    expect(capabilities).toHaveBeenCalledWith("tenant-a", expect.any(AbortSignal));
  });

  it("redirects when a capability is absent", async () => {
    const capabilities = vi.fn().mockResolvedValue({
      tenant_id: "tenant-a",
      policy_version: "test-policy",
      capabilities: ["menu.read"],
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <CapabilityGuard
                client={{ tenants: { capabilities } }}
                tenantId="tenant-a"
                require="menu.write"
                redirectTo="/denied"
              >
                <div>Protected</div>
              </CapabilityGuard>
            }
          />
          <Route path="/denied" element={<div>Denied</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Denied")).toBeInTheDocument());
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("denies when the capability projection request fails", async () => {
    const capabilities = vi.fn().mockRejectedValue(new Error("forbidden"));

    render(
      <MemoryRouter>
        <CapabilityGuard
          client={{ tenants: { capabilities } }}
          tenantId="tenant-a"
          require="order.read"
          fallback={<div>Unavailable</div>}
        >
          <div>Protected</div>
        </CapabilityGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Unavailable")).toBeInTheDocument());
  });
});
