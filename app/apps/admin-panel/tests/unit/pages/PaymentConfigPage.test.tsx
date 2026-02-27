/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen, waitFor, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

vi.mock("../../../src/api/client", () => ({
  api: {
    payments: {
      updateP24Config: vi.fn(),
    },
  },
}));

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(),
}));

import { api } from "../../../src/api/client";
import { useCurrentTenant } from "../../../src/context/TenantContext";
import { PaymentConfigPage } from "../../../src/pages/PaymentConfigPage";

// eslint-disable-next-line @typescript-eslint/unbound-method
const mockUpdateP24Config = api.payments.updateP24Config as Mock;
const mockUseCurrentTenant = useCurrentTenant as Mock;

const renderPage = (): RenderResult =>
  render(
    <MemoryRouter>
      <PaymentConfigPage />
    </MemoryRouter>,
  );

describe("PaymentConfigPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: "550e8400-e29b-41d4-a716-446655440000",
      selectedTenant: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Main Restaurant",
      },
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
  });

  it("renders selected restaurant details and payment fields", () => {
    renderPage();

    expect(screen.getByText(/selected restaurant/i)).toBeInTheDocument();
    expect(screen.getByText(/main restaurant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/merchant id/i)).toBeDefined();
    expect(screen.getByLabelText(/p24 api key/i)).toBeDefined();
    expect(screen.getByLabelText(/p24 crc key/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDefined();
  });

  it("disables submit button when form is empty", () => {
    renderPage();

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDisabled();
  });

  it("enables submit button when all fields are filled", async () => {
    const user = userEvent.setup();

    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "123456");
    await user.type(screen.getByLabelText(/p24 api key/i), "test-api-key");
    await user.type(screen.getByLabelText(/p24 crc key/i), "test-crc-key");

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeEnabled();
  });

  it("calls API with selected tenant on submit", async () => {
    const user = userEvent.setup();

    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "123456");
    await user.type(screen.getByLabelText(/p24 api key/i), "my-api-key");
    await user.type(screen.getByLabelText(/p24 crc key/i), "my-crc-key");
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", {
        p24_merchantid: 123456,
        p24_api: "my-api-key",
        p24_crc: "my-crc-key",
      });
    });
  });

  it("shows success message after successful submit", async () => {
    const user = userEvent.setup();

    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "123456");
    await user.type(screen.getByLabelText(/p24 api key/i), "test-api-key");
    await user.type(screen.getByLabelText(/p24 crc key/i), "test-crc-key");
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message when API call fails", async () => {
    const user = userEvent.setup();

    mockUpdateP24Config.mockRejectedValueOnce(new Error("Network error"));
    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "123456");
    await user.type(screen.getByLabelText(/p24 api key/i), "test-api-key");
    await user.type(screen.getByLabelText(/p24 crc key/i), "test-crc-key");
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to update p24 configuration/i)).toBeInTheDocument();
    });
  });

  it("shows 'Saving...' text while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise!: () => void;

    mockUpdateP24Config.mockReturnValueOnce(new Promise<void>((resolve) => (resolvePromise = resolve)));
    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "123456");
    await user.type(screen.getByLabelText(/p24 api key/i), "test-api-key");
    await user.type(screen.getByLabelText(/p24 crc key/i), "test-crc-key");
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolvePromise();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });
  });

  it("clears status message when user edits a field after success", async () => {
    const user = userEvent.setup();

    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "123456");
    await user.type(screen.getByLabelText(/p24 api key/i), "test-api-key");
    await user.type(screen.getByLabelText(/p24 crc key/i), "test-crc-key");
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/p24 api key/i), "x");

    expect(screen.queryByText(/p24 configuration updated successfully/i)).not.toBeInTheDocument();
  });

  it("trims whitespace from input values before sending", async () => {
    const user = userEvent.setup();

    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: "  some-id  ",
      selectedTenant: {
        id: "some-id",
        name: "Main Restaurant",
      },
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await user.type(screen.getByLabelText(/merchant id/i), "100");
    await user.type(screen.getByLabelText(/p24 api key/i), "  key  ");
    await user.type(screen.getByLabelText(/p24 crc key/i), "  crc  ");
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledWith("some-id", {
        p24_merchantid: 100,
        p24_api: "key",
        p24_crc: "crc",
      });
    });
  });

  it("shows a clear state when no tenant is selected", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenant: null,
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    renderPage();

    expect(screen.getByText(/no restaurant selected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDisabled();
    expect(mockUpdateP24Config).not.toHaveBeenCalled();
  });
});
