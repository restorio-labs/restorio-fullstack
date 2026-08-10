import { fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("../../../src/api/client", () => ({
  api: {
    auth: { refresh: vi.fn() },
    tenants: { create: vi.fn() },
    tenantProfiles: { save: vi.fn() },
  },
}));

vi.mock("../../../src/context/TenantContext", async () => {
  const actual = await vi.importActual<typeof import("../../../src/context/TenantContext")>(
    "../../../src/context/TenantContext",
  );

  return {
    ...actual,
    useCurrentTenant: vi.fn(),
  };
});

vi.mock("../../../src/features/profile/LocationPickerMap", () => ({
  LocationPickerMap: ({ onLocationChange }: { onLocationChange: (latitude: number, longitude: number) => void }) => (
    <button type="button" onClick={() => onLocationChange(52.2297, 21.0122)}>
      Select map location
    </button>
  ),
}));

import { api } from "../../../src/api/client";
import { useCurrentTenant } from "../../../src/context/TenantContext";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { OnboardingPage } from "../../../src/pages/OnboardingPage";

const mockCreateTenant = api.tenants.create as Mock;
const mockSaveProfile = api.tenantProfiles.save as Mock;
const mockUseCurrentTenant = useCurrentTenant as Mock;

const renderPage = (): RenderResult =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <OnboardingPage />
      </I18nProvider>
    </QueryClientProvider>,
  );

const setValue = (label: RegExp, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTenant.mockReturnValue({
      refreshTenants: vi.fn(),
      setSelectedTenantId: vi.fn(),
    });
  });

  it("introduces features while progressing through the required setup", async () => {
    renderPage();

    expect(screen.getByText("Your restaurant starts organized")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-feature-panel")).toHaveAttribute("data-step", "0");
    expect(screen.getByTestId("onboarding-feature-panel")).toHaveStyle({
      backgroundColor: "var(--color-interactive-primary)",
    });
    expect(screen.getByTestId("onboarding-overlay-top-card")).toHaveStyle({ left: "4%", top: "8%" });
    expect(screen.getByTestId("onboarding-overlay-bottom-card")).toHaveStyle({
      left: "calc(100% - 9rem)",
      top: "calc(100% - 5.5rem)",
    });
    expect(screen.getByText("Bistro Nova")).toBeInTheDocument();
    expect(screen.getByText("ul. Długa 12")).toBeInTheDocument();

    setValue(/restaurant name/i, "Balans");
    setValue(/street name/i, "Main");
    setValue(/street number/i, "1");
    setValue(/^city$/i, "Warsaw");
    setValue(/postal code/i, "00-001");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText("Guide guests to the right place")).toBeInTheDocument();
    expect(screen.getByLabelText(/show this restaurant publicly/i)).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-feature-panel")).toHaveAttribute("data-step", "1");
    expect(screen.getByTestId("onboarding-feature-panel")).toHaveStyle({
      backgroundColor: "var(--color-interactive-primary-hover)",
    });
    expect(screen.getByTestId("onboarding-overlay-top-card")).toHaveStyle({
      left: "4%",
      top: "calc(100% - 5.5rem)",
    });
    expect(screen.getByTestId("onboarding-overlay-bottom-card")).toHaveStyle({
      left: "calc(100% - 9rem)",
      top: "8%",
    });
    expect(screen.getByText("Location selected")).toBeInTheDocument();
    expect(screen.getByText("Pin the entrance")).toBeInTheDocument();
  });

  it("allows continuing without a map location", async () => {
    renderPage();

    setValue(/restaurant name/i, "Balans");
    setValue(/street name/i, "Main");
    setValue(/street number/i, "1");
    setValue(/^city$/i, "Warsaw");
    setValue(/postal code/i, "00-001");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByRole("button", { name: /select map location/i });
    expect(screen.queryByLabelText(/^latitude$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^longitude$/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByLabelText(/^nip$/i)).toBeInTheDocument();
  });

  it("creates the complete profile with a map location", async () => {
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-1",
      name: "Balans",
      slug: "balans-main-1-warsaw",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });
    mockSaveProfile.mockResolvedValueOnce({});
    renderPage();

    setValue(/restaurant name/i, "Balans");
    setValue(/street name/i, "Main");
    setValue(/street number/i, "1");
    setValue(/^city$/i, "Warsaw");
    setValue(/postal code/i, "00-001");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    fireEvent.click(await screen.findByRole("button", { name: /select map location/i }));
    fireEvent.click(screen.getByRole("switch", { name: /show this restaurant publicly/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByLabelText(/^nip$/i);
    setValue(/^nip$/i, "1234567890");
    setValue(/company name/i, "Balans Sp. z o.o.");
    setValue(/contact email/i, "hello@balans.pl");
    setValue(/^phone$/i, "+48123456789");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText("Confirm ownership");
    setValue(/^first name$/i, "Jan");
    setValue(/^last name$/i, "Kowalski");
    fireEvent.click(screen.getByRole("button", { name: /create restaurant/i }));

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        "tenant-1",
        expect.objectContaining({
          latitude: 52.2297,
          longitude: 21.0122,
          location_source: "manual",
          location_precision: "approximate",
          is_location_public: true,
        }),
      );
    });
  });

  it("creates the profile without a location", async () => {
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-1",
      name: "Balans",
      slug: "balans-main-1-warsaw",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });
    mockSaveProfile.mockResolvedValueOnce({});
    renderPage();

    setValue(/restaurant name/i, "Balans");
    setValue(/street name/i, "Main");
    setValue(/street number/i, "1");
    setValue(/^city$/i, "Warsaw");
    setValue(/postal code/i, "00-001");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByRole("button", { name: /select map location/i });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByLabelText(/^nip$/i);
    setValue(/^nip$/i, "1234567890");
    setValue(/company name/i, "Balans Sp. z o.o.");
    setValue(/contact email/i, "hello@balans.pl");
    setValue(/^phone$/i, "+48123456789");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText("Confirm ownership");
    setValue(/^first name$/i, "Jan");
    setValue(/^last name$/i, "Kowalski");
    fireEvent.click(screen.getByRole("button", { name: /create restaurant/i }));

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        "tenant-1",
        expect.objectContaining({
          latitude: null,
          longitude: null,
          location_source: null,
          location_precision: null,
          is_location_public: false,
        }),
      );
    });
  });
});
