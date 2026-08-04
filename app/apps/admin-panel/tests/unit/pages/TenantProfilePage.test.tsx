import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../../src/api/client", () => ({
  api: {
    tenantProfiles: {
      get: vi.fn(),
      save: vi.fn(),
      createLogoUploadUrl: vi.fn(),
      createLogoViewUrl: vi.fn(),
    },
  },
}));

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(() => ({ selectedTenant: { id: "tenant-1" } })),
}));

import { api } from "../../../src/api/client";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { TenantProfilePage, type TenantProfileSection } from "../../../src/pages/TenantProfilePage";

const tenantProfilesApi = api.tenantProfiles as unknown as Record<string, Mock>;
const profile = {
  nip: "1234567890",
  companyName: "Restorio Sp. z o.o.",
  logo: null,
  contactEmail: "hello@example.com",
  phone: "+48123456789",
  addressStreetName: "Main Street",
  addressStreetNumber: "1",
  addressCity: "Warsaw",
  addressPostalCode: "00-001",
  addressCountry: "Poland",
  latitude: 52.2297,
  longitude: 21.0122,
  isLocationPublic: true,
  ownerFirstName: "Anna",
  ownerLastName: "Nowak",
  ownerEmail: "anna@example.com",
  ownerPhone: "+48987654321",
  contactPersonFirstName: "Jan",
  contactPersonLastName: "Kowalski",
  contactPersonEmail: "jan@example.com",
  contactPersonPhone: "+48111222333",
  socialFacebook: "",
  socialInstagram: "",
  socialTiktok: "",
  socialWebsite: "",
};

const renderPage = (section: TenantProfileSection) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <TenantProfilePage section={section} />
      </I18nProvider>
    </QueryClientProvider>,
  );

describe("TenantProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantProfilesApi.get.mockResolvedValue(profile);
    tenantProfilesApi.save.mockResolvedValue(profile);
  });

  it("renders only the fieldsets assigned to the selected profile section", async () => {
    renderPage("address-location");

    expect(await screen.findByRole("heading", { name: "Address and map location" })).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Map location")).toBeInTheDocument();
    expect(
      await screen.findByRole("region", { name: "Select the restaurant location on the map" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Company Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Owner Details")).not.toBeInTheDocument();
  });

  it("keeps hidden profile values when saving a single section", async () => {
    renderPage("social-media");

    const website = await screen.findByLabelText("Website");
    fireEvent.change(website, { target: { value: "https://restorio.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Profile" }));

    await waitFor(() => {
      expect(tenantProfilesApi.save).toHaveBeenCalledWith(
        "tenant-1",
        expect.objectContaining({
          company_name: "Restorio Sp. z o.o.",
          address_city: "Warsaw",
          owner_first_name: "Anna",
          social_website: "https://restorio.example",
        }),
      );
    });
  });
});
