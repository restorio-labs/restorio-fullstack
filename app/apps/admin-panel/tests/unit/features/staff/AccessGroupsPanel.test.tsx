import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider, ToastProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@restorio/auth", () => ({
  useCan: vi.fn(() => true),
}));

vi.mock("../../../../src/api/client", () => ({
  api: {
    accessGroups: {
      list: vi.fn(),
      options: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      assign: vi.fn(),
      unassign: vi.fn(),
    },
  },
}));

import { api } from "../../../../src/api/client";
import { AccessGroupsPanel } from "../../../../src/features/staff/components/AccessGroupsPanel";
import { fallbackMessages, getMessages } from "../../../../src/i18n/messages";

const accessGroups = api.accessGroups as unknown as Record<string, Mock>;

const renderPanel = (locale: "en" | "pl" = "en", createRequestKey = 0) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <I18nProvider locale={locale} messages={getMessages(locale)} fallbackMessages={fallbackMessages}>
        <ToastProvider>
          <AccessGroupsPanel
            tenantId="tenant-1"
            employees={[{ id: "employee-1", email: "chef@example.com" }]}
            createRequestKey={createRequestKey}
          />
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );

describe("AccessGroupsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accessGroups.list.mockResolvedValue([]);
    accessGroups.options.mockResolvedValue({ capabilities: ["menu.availability.update", "order.refund"] });
  });

  it("creates a group from server-provided delegable capabilities", async () => {
    accessGroups.create.mockResolvedValue({
      id: "group-1",
      name: "Shift leads",
      description: null,
      capabilities: ["order.refund"],
      member_ids: [],
    });
    renderPanel("en", 1);

    fireEvent.change(await screen.findByLabelText(/group name/i), { target: { value: "Shift leads" } });
    fireEvent.click(screen.getByLabelText(/refund orders/i));
    fireEvent.click(screen.getByRole("button", { name: /save group/i }));

    await waitFor(() => {
      expect(accessGroups.create).toHaveBeenCalledWith("tenant-1", {
        name: "Shift leads",
        description: null,
        capabilities: ["order.refund"],
      });
    });
  });

  it("assigns an employee to an existing group", async () => {
    accessGroups.list.mockResolvedValue([
      {
        id: "group-1",
        name: "Shift leads",
        description: null,
        capabilities: ["order.refund"],
        member_ids: [],
      },
    ]);
    accessGroups.assign.mockResolvedValue(undefined);
    renderPanel();

    fireEvent.click(await screen.findByLabelText("chef@example.com"));

    await waitFor(() => {
      expect(accessGroups.assign).toHaveBeenCalledWith("tenant-1", "group-1", "employee-1");
    });
  });

  it("renders capability names in Polish", async () => {
    renderPanel("pl", 1);

    expect(await screen.findByLabelText("Zmiana dostępności pozycji menu")).toBeInTheDocument();
    expect(screen.getByLabelText("Zwracanie płatności za zamówienia")).toBeInTheDocument();
  });
});
