/* eslint-disable @typescript-eslint/no-unsafe-call */
import { fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("../../../src/api/client", () => ({
  api: {
    tenants: {
      create: vi.fn(),
    },
    tenantProfiles: {
      save: vi.fn(),
    },
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

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { api } from "../../../src/api/client";
import { useCurrentTenant } from "../../../src/context/TenantContext";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { RestaurantCreatorPage } from "../../../src/pages/RestaurantCreatorPage";

const mockCreateTenant = api.tenants.create as Mock;
const mockSaveProfile = api.tenantProfiles.save as Mock;
const mockUseCurrentTenant = useCurrentTenant as Mock;

const renderPage = (queryClient: QueryClient = new QueryClient()): RenderResult =>
  render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <MemoryRouter>
          <RestaurantCreatorPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );

const submitCreateForm = (): void => {
  const form = document.getElementById("restaurant-creator-form");

  if (!form) {
    throw new Error("restaurant creator form not found");
  }

  fireEvent.submit(form);
};

const setInputValue = (name: string, value: string): void => {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);

  if (!input) {
    throw new Error(`input '${name}' not found`);
  }

  fireEvent.change(input, { target: { value } });
};

const fillRequiredProfileFields = (): void => {
  setInputValue("nip", "1234567890");
  setInputValue("companyName", "Bistro Nova LLC");
  setInputValue("contactEmail", "contact@example.com");
  setInputValue("phone", "+48 123 456 789");
  setInputValue("addressStreet", "Main 1");
  setInputValue("addressCity", "Warsaw");
  setInputValue("addressPostalCode", "00-001");
  setInputValue("ownerFirstName", "John");
  setInputValue("ownerLastName", "Smith");
};

describe("RestaurantCreatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTenant.mockReturnValue({
      refreshTenants: vi.fn(),
      setSelectedTenantId: vi.fn(),
    });
  });

  it("does not render a slug input in the form", () => {
    renderPage();

    expect(screen.queryByLabelText(/^slug$/i)).not.toBeInTheDocument();
  });

  it("submits tenant with generated slug and handles success flow", async () => {
    const queryClient = new QueryClient();
    const refreshTenants = vi.fn();
    const setSelectedTenantId = vi.fn();
    mockUseCurrentTenant.mockReturnValue({
      refreshTenants,
      setSelectedTenantId,
    });
    queryClient.setQueryData(["tenants"], [
      {
        id: "tenant-1",
        name: "Old Name",
        slug: "old-name",
        status: "ACTIVE",
        activeLayoutVersionId: null,
        floorCanvasCount: 1,
        createdAt: new Date(),
      },
    ]);
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-1",
      name: "New Name",
      slug: "new-name",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });

    renderPage(queryClient);

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "  New Name  " } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledWith({
        name: "New Name",
        slug: "new-name",
        status: "ACTIVE",
      });
    });

    expect(mockSaveProfile).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(setSelectedTenantId).toHaveBeenCalledWith("tenant-1");
      expect(refreshTenants).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("saves tenant profile when accordion is expanded and required fields are filled", async () => {
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-100",
      name: "New Name",
      slug: "new-name",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });
    mockSaveProfile.mockResolvedValueOnce({});
    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: /add profile now/i }));
    fillRequiredProfileFields();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        "tenant-100",
        expect.objectContaining({
          nip: "1234567890",
          company_name: "Bistro Nova LLC",
          contact_email: "contact@example.com",
          phone: "+48 123 456 789",
          address_street: "Main 1",
          address_city: "Warsaw",
          address_postal_code: "00-001",
          owner_first_name: "John",
          owner_last_name: "Smith",
        }),
      );
    });
  });

  it("blocks submit with client validation when profile accordion is expanded but required fields are missing", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "Valid Name" } });
    fireEvent.click(screen.getByRole("button", { name: /add profile now/i }));
    submitCreateForm();

    await waitFor(() => {
      expect(screen.getByText(/NIP must be exactly 10 digits/i)).toBeInTheDocument();
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
    });

    expect(mockCreateTenant).not.toHaveBeenCalled();
  });

  it("shows client-side required error when restaurant name is missing", async () => {
    renderPage();

    submitCreateForm();

    await waitFor(() => {
      expect(screen.getByText(/restaurant name is required\./i)).toBeInTheDocument();
    });

    expect(mockCreateTenant).not.toHaveBeenCalled();
  });

  it("shows validation error when create tenant API returns 422", async () => {
    mockCreateTenant.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          fields: ["name"],
        },
      },
    });
    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "Valid Name" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/please fix the highlighted fields and try again/i)).toBeInTheDocument();
      expect(screen.getByText(/restaurant name is required\./i)).toBeInTheDocument();
    });
  });

  it("shows validation error when profile save returns 422", async () => {
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-200",
      name: "New Name",
      slug: "new-name",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });
    mockSaveProfile.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          fields: ["nip"],
        },
      },
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: /add profile now/i }));
    fillRequiredProfileFields();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(screen.getByText(/please fix the highlighted fields and try again/i)).toBeInTheDocument();
      expect(screen.getByText(/NIP must be exactly 10 digits/i)).toBeInTheDocument();
    });
  });

  it("shows profile-specific error when profile save fails without validation payload", async () => {
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-300",
      name: "New Name",
      slug: "new-name",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });
    mockSaveProfile.mockRejectedValueOnce(new Error("network"));

    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: /add profile now/i }));
    fillRequiredProfileFields();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(screen.getByText(/restaurant was created, but profile could not be saved\./i)).toBeInTheDocument();
    });
  });

  it("falls back to default country when profile country is left empty", async () => {
    mockCreateTenant.mockResolvedValueOnce({
      id: "tenant-301",
      name: "New Name",
      slug: "new-name",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });
    mockSaveProfile.mockResolvedValueOnce({});
    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: /add profile now/i }));
    fillRequiredProfileFields();
    setInputValue("addressCountry", " ");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        "tenant-301",
        expect.objectContaining({
          address_country: "Polska",
        }),
      );
    });
  });

  it("shows generic create error when create API fails without validation payload", async () => {
    mockCreateTenant.mockRejectedValueOnce(new Error("network"));
    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "Valid Name" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/failed to create restaurant\. please try again\./i)).toBeInTheDocument();
    });
  });

  it("disables submit while mutation is pending and shows creating label", async () => {
    let resolvePromise!: (value: unknown) => void;
    mockCreateTenant.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)));
    renderPage();

    fireEvent.change(screen.getByLabelText(/restaurant name/i), { target: { value: "Valid Name" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create restaurant/i })).toBeEnabled();
    });
    submitCreateForm();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });

    resolvePromise({
      id: "tenant-400",
      name: "Valid Name",
      slug: "valid-name",
      status: "ACTIVE",
      activeLayoutVersionId: null,
      floorCanvases: [],
      createdAt: new Date(),
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
