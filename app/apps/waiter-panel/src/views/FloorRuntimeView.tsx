import { TokenStorage } from "@restorio/auth";
import type { FloorCanvas as FloorCanvasType, TableDisplayInfo, TableRuntimeState, Tenant } from "@restorio/types";
import { Button, FloorCanvas, Modal, useI18n, useMediaQuery } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;
const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";

interface FloorRuntimeViewProps {
  venue: Tenant;
  selectedFloorId?: string | null;
  tableStates?: Record<string, TableRuntimeState>;
  tableDisplayInfo?: Record<string, TableDisplayInfo>;
}

interface RuntimeMenuItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  price: number;
}

interface OrderedRuntimeItem extends RuntimeMenuItem {
  quantity: number;
}

interface RemoteOrderItemPayload {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers: string[];
}

interface RemoteOrderPayload {
  id: string;
  table_id: string | null;
  table_ref: string | null;
  status: string;
  waiter_name: string | null;
  waiter_surname: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isOccupiedOrderStatus = (status: string): boolean => {
  return status !== "paid" && status !== "cancelled";
};

export const FloorRuntimeView = ({
  venue,
  selectedFloorId,
  tableStates: initialTableStates = {},
  tableDisplayInfo: initialTableDisplayInfo = {},
}: FloorRuntimeViewProps): ReactElement => {
  const { t } = useI18n();
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktopUp = useMediaQuery("(min-width: 1280px)");
  const [tableStates] = useState<Record<string, TableRuntimeState>>(initialTableStates);
  const [tableDisplayInfo, setTableDisplayInfo] = useState<Record<string, TableDisplayInfo>>(() => ({
    ...initialTableDisplayInfo,
  }));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [tableOrderItems, setTableOrderItems] = useState<Record<string, OrderedRuntimeItem[]>>({});
  const [tableOrderNotes, setTableOrderNotes] = useState<Record<string, string>>({});
  const [tableOrderIds, setTableOrderIds] = useState<Record<string, string>>({});
  const hasCanvases = venue.floorCanvases.length > 0;

  const activeCanvas = hasCanvases
    ? (venue.floorCanvases.find((c: FloorCanvasType) => c.id === selectedFloorId) ??
      venue.floorCanvases.find((c: FloorCanvasType) => c.id === venue.activeLayoutVersionId) ??
      venue.floorCanvases[0])
    : undefined;
  const runtimeScale = isDesktopUp ? 1.2 : isTabletUp ? 1.12 : 1;
  const runtimeCanvas = useMemo(() => {
    if (!activeCanvas) {
      return undefined;
    }

    return {
      ...activeCanvas,
      width: Math.round(activeCanvas.width * runtimeScale),
      height: Math.round(activeCanvas.height * runtimeScale),
      elements: activeCanvas.elements.map((element) => {
        const scaledElement = {
          ...element,
          x: Math.round(element.x * runtimeScale),
          y: Math.round(element.y * runtimeScale),
          w: Math.round(element.w * runtimeScale),
          h: Math.round(element.h * runtimeScale),
        };

        if (element.type !== "table") {
          return scaledElement;
        }

        return {
          ...scaledElement,
          label: t("floorEditor.tableLabel", { number: element.tableNumber }),
        };
      }),
    };
  }, [activeCanvas, runtimeScale, t]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ["waiter-panel", "menu-items", venue.id],
    queryFn: async (): Promise<RuntimeMenuItem[]> => {
      try {
        const accessToken = TokenStorage.getAccessToken();
        const response = await fetch(`${API_BASE_URL}/tenants/${venue.id}/menu`, {
          method: "GET",
          credentials: "include",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });

        if (!response.ok) {
          return [];
        }

        const payload: unknown = await response.json();

        if (!isRecord(payload)) {
          return [];
        }

        const { data } = payload;

        if (!isRecord(data)) {
          return [];
        }

        const { categories } = data;

        if (!Array.isArray(categories)) {
          return [];
        }

        const parsedItems: RuntimeMenuItem[] = [];

        for (const category of categories) {
          if (!isRecord(category)) {
            continue;
          }

          const { order: categoryOrderRaw, items } = category;
          const categoryOrder = typeof categoryOrderRaw === "number" ? categoryOrderRaw : 0;

          if (!Array.isArray(items)) {
            continue;
          }

          for (const item of items) {
            if (!isRecord(item)) {
              continue;
            }

            const { name: nameRaw, price: priceRaw, active } = item;
            const name = typeof nameRaw === "string" ? nameRaw : "";
            const price = typeof priceRaw === "number" ? priceRaw : NaN;

            if (name.trim() === "" || !Number.isFinite(price) || active !== 1) {
              continue;
            }

            parsedItems.push({
              id: `${categoryOrder}-${name}`,
              name,
              description: typeof item.desc === "string" ? item.desc : "",
              tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : [],
              price,
            });
          }
        }

        return parsedItems;
      } catch {
        return [];
      }
    },
  });

  const { data: remoteOrders = [] } = useQuery({
    queryKey: ["waiter-panel", "orders", venue.id],
    queryFn: async (): Promise<RemoteOrderPayload[]> => {
      try {
        const accessToken = TokenStorage.getAccessToken();
        const response = await fetch(`${API_BASE_URL}/tenants/${venue.id}/orders`, {
          method: "GET",
          credentials: "include",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });

        if (!response.ok) {
          return [];
        }

        const payload: unknown = await response.json();

        if (!isRecord(payload) || !Array.isArray(payload.data)) {
          return [];
        }

        return payload.data.flatMap((row): RemoteOrderPayload[] => {
          if (!isRecord(row) || typeof row.id !== "string" || typeof row.status !== "string") {
            return [];
          }

          const tableRef = typeof row.table_ref === "string" ? row.table_ref : null;
          const tableId = typeof row.table_id === "string" ? row.table_id : null;
          const resolvedTableRef = tableRef ?? tableId;

          if (resolvedTableRef === null) {
            return [];
          }

          return [
            {
              id: row.id,
              table_id: tableId,
              table_ref: resolvedTableRef,
              status: row.status,
              waiter_name: typeof row.waiter_name === "string" ? row.waiter_name : null,
              waiter_surname: typeof row.waiter_surname === "string" ? row.waiter_surname : null,
            },
          ];
        });
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const remoteOrderIdsByTable = useMemo<Record<string, string>>(() => {
    return remoteOrders.reduce<Record<string, string>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.table_ref) {
        return acc;
      }

      acc[order.table_ref] = order.id;

      return acc;
    }, {});
  }, [remoteOrders]);

  const remoteTableDisplayInfo = useMemo<Record<string, TableDisplayInfo>>(() => {
    return remoteOrders.reduce<Record<string, TableDisplayInfo>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.table_ref) {
        return acc;
      }

      acc[order.table_ref] = {
        orderStatus: "ordered",
        servedByName: order.waiter_name ?? undefined,
        servedBySurname: order.waiter_surname ?? undefined,
      };

      return acc;
    }, {});
  }, [remoteOrders]);

  const effectiveTableDisplayInfo = useMemo<Record<string, TableDisplayInfo>>(
    () => ({
      ...tableDisplayInfo,
      ...remoteTableDisplayInfo,
    }),
    [remoteTableDisplayInfo, tableDisplayInfo],
  );

  const selectedTableElement = useMemo(() => {
    if (!runtimeCanvas || !selectedElementId) {
      return undefined;
    }

    const element = runtimeCanvas.elements.find((candidate) => candidate.id === selectedElementId);

    if (!element) {
      return undefined;
    }

    if (element.type !== "table" && element.type !== "tableGroup") {
      return undefined;
    }

    return element;
  }, [runtimeCanvas, selectedElementId]);

  const selectedTableDisplayInfo = selectedTableElement
    ? effectiveTableDisplayInfo[selectedTableElement.id]
    : undefined;
  const selectedTableHasOrder =
    selectedTableDisplayInfo?.orderStatus !== undefined && selectedTableDisplayInfo.orderStatus !== "browsing";
  const isSelectedTableAvailable = Boolean(selectedTableElement) && !selectedTableHasOrder;
  const selectedTableOrderItems = useMemo(
    () => (selectedTableElement ? (tableOrderItems[selectedTableElement.id] ?? []) : []),
    [selectedTableElement, tableOrderItems],
  );
  const selectedTableOrderNote = useMemo(
    () => (selectedTableElement ? (tableOrderNotes[selectedTableElement.id] ?? "") : ""),
    [selectedTableElement, tableOrderNotes],
  );
  const selectedTableOrderId = useMemo(
    () =>
      selectedTableElement
        ? (tableOrderIds[selectedTableElement.id] ?? remoteOrderIdsByTable[selectedTableElement.id])
        : undefined,
    [remoteOrderIdsByTable, selectedTableElement, tableOrderIds],
  );

  const selectedTableName = useMemo(() => {
    if (!selectedTableElement) {
      return "";
    }

    if (selectedTableElement.type === "table") {
      return t("floorEditor.tableLabel", { number: selectedTableElement.tableNumber });
    }

    return t("waiterDashboard.tableGroupLabel", { numbers: selectedTableElement.tableNumbers.join(", ") });
  }, [selectedTableElement, t]);

  const selectedTableSeats = selectedTableElement?.seats;

  const handleElementPointerDown = useCallback(
    (id: string): void => {
      if (!runtimeCanvas) {
        setSelectedElementId(null);

        return;
      }

      const element = runtimeCanvas.elements.find((candidate) => candidate.id === id);

      if (!element || (element.type !== "table" && element.type !== "tableGroup")) {
        setSelectedElementId(null);

        return;
      }

      setSelectedElementId((prev) => (prev === id ? null : id));
    },
    [runtimeCanvas],
  );

  const handleClosePanel = useCallback((): void => {
    setSelectedElementId(null);
    setIsAddItemModalOpen(false);
  }, []);

  const handleOpenAddItemModal = useCallback((): void => {
    if (!selectedTableElement || isSelectedTableAvailable) {
      return;
    }

    setIsAddItemModalOpen(true);
  }, [isSelectedTableAvailable, selectedTableElement]);

  const handleCloseAddItemModal = useCallback((): void => {
    setIsAddItemModalOpen(false);
  }, []);

  const toRemoteOrderItems = useCallback((items: OrderedRuntimeItem[]): RemoteOrderItemPayload[] => {
    return items.map((item) => ({
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      modifiers: [],
    }));
  }, []);

  const createRemoteOrder = useCallback(
    async (tableElementId: string): Promise<{ id: string; waiterName?: string; waiterSurname?: string } | null> => {
      const accessToken = TokenStorage.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/tenants/${venue.id}/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          table_id: tableElementId,
          items: [],
        }),
      });

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();

      if (!isRecord(payload) || !isRecord(payload.data) || typeof payload.data.id !== "string") {
        return null;
      }

      return {
        id: payload.data.id,
        waiterName: typeof payload.data.waiter_name === "string" ? payload.data.waiter_name : undefined,
        waiterSurname: typeof payload.data.waiter_surname === "string" ? payload.data.waiter_surname : undefined,
      };
    },
    [venue.id],
  );

  const syncRemoteOrder = useCallback(
    async (orderId: string, items?: OrderedRuntimeItem[], status?: "pending" | "paid"): Promise<boolean> => {
      const accessToken = TokenStorage.getAccessToken();
      const body: Record<string, unknown> = {};

      if (items) {
        body.items = toRemoteOrderItems(items);
      }

      if (status) {
        body.status = status;
      }

      const response = await fetch(`${API_BASE_URL}/tenants/${venue.id}/orders/${orderId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });

      return response.ok;
    },
    [toRemoteOrderItems, venue.id],
  );

  const handleBeginOrder = useCallback(async (): Promise<void> => {
    if (!selectedTableElement || !isSelectedTableAvailable) {
      return;
    }

    const createdOrder = await createRemoteOrder(selectedTableElement.id);

    if (!createdOrder) {
      return;
    }

    setTableOrderIds((prev) => ({
      ...prev,
      [selectedTableElement.id]: createdOrder.id,
    }));
    setTableDisplayInfo((prev) => ({
      ...prev,
      [selectedTableElement.id]: {
        ...prev[selectedTableElement.id],
        orderStatus: "ordering",
        servedByName: createdOrder.waiterName,
        servedBySurname: createdOrder.waiterSurname,
        guestCount: Object.prototype.hasOwnProperty.call(prev, selectedTableElement.id)
          ? (prev[selectedTableElement.id].guestCount ?? selectedTableElement.seats)
          : selectedTableElement.seats,
      },
    }));
    setTableOrderItems((prev) => ({
      ...prev,
      [selectedTableElement.id]: prev[selectedTableElement.id] ?? [],
    }));
  }, [createRemoteOrder, isSelectedTableAvailable, selectedTableElement]);

  const handleAddItemToOrder = useCallback(
    async (menuItemId: string): Promise<void> => {
      if (!selectedTableElement || isSelectedTableAvailable || menuItemId.trim() === "" || !selectedTableOrderId) {
        return;
      }

      const selectedMenuItem = menuItems.find((item) => item.id === menuItemId);

      if (!selectedMenuItem) {
        return;
      }

      const existingItems = selectedTableOrderItems;
      const existingItem = existingItems.find((item) => item.id === selectedMenuItem.id);
      const nextItems = !existingItem
        ? [...existingItems, { ...selectedMenuItem, quantity: 1 }]
        : existingItems.map((item) =>
            item.id === selectedMenuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
          );

      const updated = await syncRemoteOrder(selectedTableOrderId, nextItems, "pending");

      if (!updated) {
        return;
      }

      setTableOrderItems((prev) => ({
        ...prev,
        [selectedTableElement.id]: nextItems,
      }));
      setTableDisplayInfo((prev) => ({
        ...prev,
        [selectedTableElement.id]: {
          ...prev[selectedTableElement.id],
          orderStatus: "ordered",
        },
      }));
      setIsAddItemModalOpen(false);
    },
    [
      isSelectedTableAvailable,
      menuItems,
      selectedTableElement,
      selectedTableOrderId,
      selectedTableOrderItems,
      syncRemoteOrder,
    ],
  );

  const handleConfirmPayment = useCallback(async (): Promise<void> => {
    if (!selectedTableElement || isSelectedTableAvailable || !selectedTableOrderId) {
      return;
    }

    const updated = await syncRemoteOrder(selectedTableOrderId, undefined, "paid");

    if (!updated) {
      return;
    }

    setTableDisplayInfo((prev) => ({
      ...prev,
      [selectedTableElement.id]: {
        ...prev[selectedTableElement.id],
        guestCount: undefined,
        orderStatus: "browsing",
        servedByName: undefined,
        servedBySurname: undefined,
      },
    }));
    setTableOrderItems((prev) => ({
      ...prev,
      [selectedTableElement.id]: [],
    }));
    setTableOrderNotes((prev) => ({
      ...prev,
      [selectedTableElement.id]: "",
    }));
    setTableOrderIds((prev) => {
      const next = { ...prev };

      delete next[selectedTableElement.id];

      return next;
    });
    setIsAddItemModalOpen(false);
  }, [isSelectedTableAvailable, selectedTableElement, selectedTableOrderId, syncRemoteOrder]);

  const handleRemoveItemFromOrder = useCallback(
    async (itemId: string): Promise<void> => {
      if (!selectedTableElement || isSelectedTableAvailable || !selectedTableOrderId) {
        return;
      }

      const targetItem = selectedTableOrderItems.find((item) => item.id === itemId);

      if (!targetItem) {
        return;
      }

      const nextItems = selectedTableOrderItems.flatMap((item) => {
        if (item.id !== itemId) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [{ ...item, quantity: item.quantity - 1 }];
      });

      const updated = await syncRemoteOrder(selectedTableOrderId, nextItems, "pending");

      if (!updated) {
        return;
      }

      setTableOrderItems((prev) => ({
        ...prev,
        [selectedTableElement.id]: nextItems,
      }));
    },
    [isSelectedTableAvailable, selectedTableElement, selectedTableOrderId, selectedTableOrderItems, syncRemoteOrder],
  );

  const handlePersistOrderNote = useCallback(async (): Promise<void> => {
    if (!selectedTableOrderId || isSelectedTableAvailable) {
      return;
    }

    await syncRemoteOrder(selectedTableOrderId, selectedTableOrderItems, "pending");
  }, [isSelectedTableAvailable, selectedTableOrderId, selectedTableOrderItems, syncRemoteOrder]);

  const selectedTableOrderTotal = selectedTableOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const occupiedTableMessage = useMemo(() => {
    if (isSelectedTableAvailable) {
      return t("waiterDashboard.tableAvailable");
    }

    const waiterFullName = [selectedTableDisplayInfo?.servedByName, selectedTableDisplayInfo?.servedBySurname]
      .filter((part): part is string => typeof part === "string" && part.trim() !== "")
      .join(" ")
      .trim();

    if (waiterFullName !== "") {
      return t("waiterDashboard.tableOccupiedByWaiter", { waiter: waiterFullName });
    }

    return t("waiterDashboard.tableOccupied");
  }, [isSelectedTableAvailable, selectedTableDisplayInfo?.servedByName, selectedTableDisplayInfo?.servedBySurname, t]);

  if (!activeCanvas) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-text-secondary">
        {t("floorRuntime.noLayout")}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      {selectedElementId && (
        <span className="text-sm text-text-secondary" aria-live="polite">
          {t("waiterDashboard.selectedElement")}
        </span>
      )}
      <div className="flex flex-1 min-h-0 gap-3">
        <div className="flex flex-1 min-h-0 rounded-lg border border-border-default bg-background-secondary overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y">
          <div className="mx-auto min-h-max min-w-max p-2">
            <FloorCanvas
              layout={runtimeCanvas ?? activeCanvas}
              showGrid={false}
              gridCellSize={20}
              tableStates={tableStates}
              tableDisplayInfo={effectiveTableDisplayInfo}
              selectedElementId={selectedElementId}
              centered={false}
              interactive
              onElementPointerDown={(id, e, _mode, _bounds) => {
                e.preventDefault();
                handleElementPointerDown(id);
              }}
            />
          </div>
        </div>
        {selectedTableElement && isTabletUp && (
          <aside className="w-[320px] shrink-0 rounded-lg border border-border-default bg-surface-primary p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{selectedTableName}</h3>
                <p className="text-sm text-text-secondary">
                  {t("waiterDashboard.tableSeats", { seats: selectedTableSeats ?? "-" })}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleClosePanel}>
                {t("waiterDashboard.closePanel")}
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isSelectedTableAvailable
                    ? "bg-status-success-background text-status-success-text"
                    : "bg-status-error-background text-status-error-text"
                }`}
              >
                {occupiedTableMessage}
              </div>
              {isSelectedTableAvailable ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    void handleBeginOrder();
                  }}
                >
                  {t("waiterDashboard.beginOrder")}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="secondary" onClick={handleOpenAddItemModal}>
                    {t("waiterDashboard.addItem")}
                  </Button>
                  <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
                    {selectedTableOrderItems.length === 0 ? (
                      <span>{t("waiterDashboard.noItemsYet")}</span>
                    ) : (
                      <div className="space-y-4 md:space-y-1">
                        {selectedTableOrderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 md:gap-2">
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{(item.price * item.quantity).toFixed(2)}</span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  void handleRemoveItemFromOrder(item.id);
                                }}
                                aria-label={t("waiterDashboard.removeItem")}
                              >
                                -
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 border-t border-border-default pt-2 font-semibold text-text-primary">
                          {t("waiterDashboard.orderTotal", { total: selectedTableOrderTotal.toFixed(2) })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="order-note-desktop" className="text-sm text-text-secondary">
                      {t("waiterDashboard.orderNoteLabel")}
                    </label>
                    <textarea
                      id="order-note-desktop"
                      rows={3}
                      value={selectedTableOrderNote}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setTableOrderNotes((prev) => ({
                          ...prev,
                          [selectedTableElement.id]: nextValue,
                        }));
                      }}
                      onBlur={() => {
                        void handlePersistOrderNote();
                      }}
                      className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      void handleConfirmPayment();
                    }}
                  >
                    {t("waiterDashboard.confirmPayment")}
                  </Button>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
      {selectedTableElement && !isTabletUp && (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-xl border border-border-default bg-surface-primary p-4 shadow-overlay">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-text-primary">{selectedTableName}</h3>
              <p className="text-sm text-text-secondary">
                {t("waiterDashboard.tableSeats", { seats: selectedTableSeats ?? "-" })}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleClosePanel}>
              {t("waiterDashboard.closePanel")}
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isSelectedTableAvailable
                  ? "bg-status-success-background text-status-success-text"
                  : "bg-status-error-background text-status-error-text"
              }`}
            >
              {occupiedTableMessage}
            </div>
            {isSelectedTableAvailable ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  void handleBeginOrder();
                }}
              >
                {t("waiterDashboard.beginOrder")}
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={handleOpenAddItemModal}>
                  {t("waiterDashboard.addItem")}
                </Button>
                <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
                  {selectedTableOrderItems.length === 0 ? (
                    <span>{t("waiterDashboard.noItemsYet")}</span>
                  ) : (
                    <div className="space-y-4 md:space-y-1">
                      {selectedTableOrderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 md:gap-2">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{(item.price * item.quantity).toFixed(2)}</span>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                void handleRemoveItemFromOrder(item.id);
                              }}
                              aria-label={t("waiterDashboard.removeItem")}
                            >
                              -
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 border-t border-border-default pt-2 font-semibold text-text-primary">
                        {t("waiterDashboard.orderTotal", { total: selectedTableOrderTotal.toFixed(2) })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="order-note-mobile" className="text-sm text-text-secondary">
                    {t("waiterDashboard.orderNoteLabel")}
                  </label>
                  <textarea
                    id="order-note-mobile"
                    rows={3}
                    value={selectedTableOrderNote}
                    onChange={(event) => {
                      const nextValue = event.target.value;

                      setTableOrderNotes((prev) => ({
                        ...prev,
                        [selectedTableElement.id]: nextValue,
                      }));
                    }}
                    onBlur={() => {
                      void handlePersistOrderNote();
                    }}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    void handleConfirmPayment();
                  }}
                >
                  {t("waiterDashboard.confirmPayment")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {selectedTableElement && !isTabletUp && <div className="h-[180px] shrink-0" />}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={handleCloseAddItemModal}
        title={t("waiterDashboard.addItemModalTitle")}
      >
        <div className="flex flex-col gap-3">
          {menuItems.length === 0 ? (
            <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
              {t("waiterDashboard.addItemModalEmpty")}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-text-primary">{item.name}</div>
                        {item.description.trim() !== "" && (
                          <div className="mt-0.5 text-xs text-text-secondary">{item.description}</div>
                        )}
                        {item.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="rounded-full border border-border-default bg-surface-primary px-2 py-0.5 text-[10px] text-text-secondary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-sm font-semibold text-text-primary">
                          {item.price.toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            void handleAddItemToOrder(item.id);
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={handleCloseAddItemModal}>
              {t("waiterDashboard.closePanel")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
