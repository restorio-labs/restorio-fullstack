import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider, ToastProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@restorio/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@restorio/auth")>();

  return {
    ...original,
    useCan: vi.fn(() => true),
  };
});

vi.mock("../../../src/api/client", () => ({
  api: {
    users: {
      list: vi.fn(),
      create: vi.fn(),
      bulkCreate: vi.fn(),
      delete: vi.fn(),
    },
    tenantProfiles: {
      get: vi.fn(),
    },
    accessGroups: {
      list: vi.fn(),
      assign: vi.fn(),
    },
  },
}));

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(() => ({ selectedTenantId: "tenant-1" })),
}));

import { api } from "../../../src/api/client";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { StaffPage } from "../../../src/pages/StaffPage";

const usersApi = api.users as unknown as Record<string, Mock>;
const tenantProfilesApi = api.tenantProfiles as unknown as Record<string, Mock>;
const accessGroupsApi = api.accessGroups as unknown as Record<string, Mock>;

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <ToastProvider>
          <StaffPage />
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );

describe("StaffPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe(): void {}
        disconnect(): void {}
      },
    );
    usersApi.list.mockResolvedValue([]);
    tenantProfilesApi.get.mockResolvedValue({ ownerEmail: "owner@example.com" });
    accessGroupsApi.list.mockResolvedValue([
      {
        id: "group-1",
        name: "Shift leads",
        description: null,
        capabilities: ["order.refund"],
        member_ids: [],
      },
    ]);
  });

  it("shows custom groups in the access dropdown and assigns the selected group", async () => {
    usersApi.create.mockResolvedValue({
      data: {
        user_id: "employee-1",
        email: "chef@example.com",
        tenant_id: "tenant-1",
        tenant_name: "Restaurant",
        tenant_slug: "restaurant",
        notification: "activation",
      },
    });
    accessGroupsApi.assign.mockResolvedValue(undefined);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /add users/i }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "chef@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /^kitchen$/i }));
    const groupOption = (await screen.findByText("Shift leads")).closest("button");

    if (!groupOption) {
      throw new Error("Access group option was not rendered as a button");
    }

    fireEvent.click(groupOption);
    fireEvent.click(screen.getByRole("button", { name: /save this user/i }));

    await waitFor(() => {
      expect(usersApi.create).toHaveBeenCalledWith("tenant-1", {
        email: "chef@example.com",
        access_level: "kitchen",
      });
      expect(accessGroupsApi.assign).toHaveBeenCalledWith("tenant-1", "group-1", "employee-1");
    });
  });
});
