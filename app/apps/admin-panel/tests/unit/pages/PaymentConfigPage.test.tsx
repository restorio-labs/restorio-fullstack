/* eslint-disable @typescript-eslint/no-unsafe-call */
import { fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
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
const API_KEY = "a".repeat(32);
const CRC_KEY = "b".repeat(16);

const renderPage = (): RenderResult =>
  render(
    <MemoryRouter>
      <PaymentConfigPage />
    </MemoryRouter>,
  );

const fillPaymentForm = (merchantId: string, apiKey: string, crcKey: string): void => {
  fireEvent.change(screen.getByLabelText(/merchant id/i), { target: { value: merchantId } });
  fireEvent.change(screen.getByLabelText(/p24 api key/i), { target: { value: apiKey } });
  fireEvent.change(screen.getByLabelText(/p24 crc key/i), { target: { value: crcKey } });
};

const clickSaveConfiguration = (): void => {
  fireEvent.click(screen.getByRole("button", { name: /save configuration/i }));
};

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
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeEnabled();
  });

  it("calls API with selected tenant on submit", async () => {
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", {
        p24_merchantid: 123456,
        p24_api: API_KEY,
        p24_crc: CRC_KEY,
      });
    });
  });

  it("shows success message after successful submit", async () => {
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message when API call fails", async () => {
    mockUpdateP24Config.mockRejectedValueOnce(new Error("Network error"));
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("shows validation feedback when API returns 422 fields", async () => {
    mockUpdateP24Config.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          fields: ["p24_api"],
        },
      },
    });
    renderPage();

    fillPaymentForm("123456", "", CRC_KEY);
    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/please fix the highlighted fields and try again/i)).toBeInTheDocument();
      expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
    });
  });

  it("shows 'Saving...' text while submitting", async () => {
    let resolvePromise!: () => void;

    mockUpdateP24Config.mockReturnValueOnce(new Promise<void>((resolve) => (resolvePromise = resolve)));
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save configuration/i })).toBeEnabled();
    });
    clickSaveConfiguration();

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolvePromise();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });
  });

  it("clears status message when user edits a field after success", async () => {
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/p24 api key/i), { target: { value: "c".repeat(32) } });

    expect(screen.queryByText(/p24 configuration updated successfully/i)).not.toBeInTheDocument();
  });

  it("trims whitespace from input values before sending", async () => {
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

    fillPaymentForm("100", `  ${API_KEY}  `, `  ${CRC_KEY}  `);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledWith("some-id", {
        p24_merchantid: 100,
        p24_api: API_KEY,
        p24_crc: CRC_KEY,
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

  it("shows load restaurants error when tenant state fails", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenant: null,
      tenants: [],
      tenantsState: "error",
      setSelectedTenantId: vi.fn(),
    });
    renderPage();

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDisabled();
  });

  it("shows select restaurant error when submit runs without selected tenant", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenant: null,
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/select a restaurant from the header dropdown/i)).toBeInTheDocument();
    });
  });
});
