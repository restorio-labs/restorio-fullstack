import type { TenantOrderRow } from "@restorio/api-client";
import type {
  FloorCanvas as FloorCanvasType,
  TableDisplayInfo,
  TableRuntimeState,
  Tenant,
  TenantMenu,
} from "@restorio/types";
import { Button, FloorCanvas, Modal, useI18n, useMediaQuery, cn } from "@restorio/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

import { api, ordersApi, tenantOrdersApi } from "@/api/client";
import { WaiterMenuDock } from "@/components/WaiterMenuDock";

interface KitchenOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedModifiers: never[];
  totalPrice: number;
}

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

const tenantMenuToRuntimeItems = (menu: TenantMenu | null): RuntimeMenuItem[] => {
  if (!menu) {
    return [];
  }

  const parsed: RuntimeMenuItem[] = [];

  for (const category of menu.categories) {
    const categoryOrder = category.order;

    for (const item of category.items) {
      if (item.name.trim() === "" || !Number.isFinite(item.price) || !item.isAvailable) {
        continue;
      }

      parsed.push({
        id: `${categoryOrder}-${item.name}`,
        name: item.name,
        description: item.desc,
        tags: item.tags,
        price: item.price,
      });
    }
  }

  return parsed;
};

const isOccupiedOrderStatus = (status: string): boolean => {
  return status !== "paid" && status !== "cancelled";
};

const mapRemoteStatusToDisplayStatus = (status: string): "browsing" | "ordering" | "ordered" => {
  switch (status) {
    case "new":
    case "pending":
      return "ordering";
    case "confirmed":
    case "preparing":
    case "ready":
    case "placed":
      return "ordered";
    default:
      return "browsing";
  }
};

const formatOccupationTime = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
};

export const FloorRuntimeView = ({
  venue,
  selectedFloorId,
  tableStates: initialTableStates = {},
  tableDisplayInfo: initialTableDisplayInfo = {},
}: FloorRuntimeViewProps): ReactElement => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktopUp = useMediaQuery("(min-width: 1280px)");
  const [tableStates] = useState<Record<string, TableRuntimeState>>(initialTableStates);
  const [tableDisplayInfo, setTableDisplayInfo] = useState<Record<string, TableDisplayInfo>>(() => ({
    ...initialTableDisplayInfo,
  }));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [panelReady, setPanelReady] = useState(false);
  const [isMenuDockOpen, setIsMenuDockOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  useEffect(() => {
    if (selectedElementId) {
      setPanelReady(false);
      const timer = setTimeout(() => setPanelReady(true), 150);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [selectedElementId]);

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
        const menu = await api.menus.get(venue.id);

        return tenantMenuToRuntimeItems(menu);
      } catch {
        return [];
      }
    },
  });

  const { data: remoteOrders = [] } = useQuery({
    queryKey: ["waiter-panel", "orders", venue.id],
    queryFn: async (): Promise<TenantOrderRow[]> => {
      try {
        const rows = await tenantOrdersApi.list(venue.id);

        return rows.flatMap((row): TenantOrderRow[] => {
          const tableRef = typeof row.table_ref === "string" ? row.table_ref : null;
          const tableId = typeof row.table_id === "string" ? row.table_id : null;
          const resolvedTableRef = tableRef ?? tableId;

          if (resolvedTableRef === null) {
            return [];
          }

          return [
            {
              ...row,
              table_ref: resolvedTableRef,
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
        orderStatus: mapRemoteStatusToDisplayStatus(order.status),
        servedByName: order.waiter_name ?? undefined,
        servedBySurname: order.waiter_surname ?? undefined,
      };

      return acc;
    }, {});
  }, [remoteOrders]);

  const remoteOrderCreatedAtByTable = useMemo<Record<string, string>>(() => {
    return remoteOrders.reduce<Record<string, string>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.table_ref) {
        return acc;
      }

      acc[order.table_ref] = String(order.created_at);

      return acc;
    }, {});
  }, [remoteOrders]);

  const remoteOrderNotesByTable = useMemo<Record<string, string>>(() => {
    return remoteOrders.reduce<Record<string, string>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.table_ref) {
        return acc;
      }

      acc[order.table_ref] = String(order.notes ?? "");

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
  const selectedTableOrderNote = useMemo(() => {
    if (!selectedTableElement) {
      return "";
    }

    if (Object.prototype.hasOwnProperty.call(tableOrderNotes, selectedTableElement.id)) {
      return tableOrderNotes[selectedTableElement.id];
    }

    return remoteOrderNotesByTable[selectedTableElement.id] ?? "";
  }, [selectedTableElement, tableOrderNotes, remoteOrderNotesByTable]);

  const selectedTableOccupationTime = useMemo(() => {
    if (!selectedTableElement) {
      return null;
    }

    const createdAt = remoteOrderCreatedAtByTable[selectedTableElement.id];

    if (!createdAt) {
      return null;
    }

    return formatOccupationTime(createdAt);
  }, [selectedTableElement, remoteOrderCreatedAtByTable]);
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
    (id: string, e: React.PointerEvent): void => {
      if (!runtimeCanvas) {
        setSelectedElementId(null);

        return;
      }

      const element = runtimeCanvas.elements.find((candidate) => candidate.id === id);

      if (!element || (element.type !== "table" && element.type !== "tableGroup")) {
        setSelectedElementId(null);

        return;
      }

      setSelectedElementId((prev) => {
        if (prev === id) {
          return null;
        }

        setClickCoords({ x: e.clientX, y: e.clientY });

        return id;
      });
    },
    [runtimeCanvas],
  );

  const handleClosePanel = useCallback((): void => {
    setSelectedElementId(null);
    setIsMenuDockOpen(false);
  }, []);

  const toKitchenOrderItems = useCallback((items: OrderedRuntimeItem[]): KitchenOrderItem[] => {
    return items.map((item) => ({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      basePrice: item.price,
      selectedModifiers: [],
      totalPrice: item.price * item.quantity,
    }));
  }, []);

  const createRemoteOrder = useCallback(
    async (tableElementId: string, tableLabel: string): Promise<{ id: string } | null> => {
      try {
        const response = await ordersApi.create(venue.id, {
          tableId: tableElementId,
          table: tableLabel,
          items: [],
          sessionId: "",
          subtotal: 0,
          tax: 0,
          total: 0,
        });

        const orderData = "data" in response && response.data !== null ? response.data : response;
        const orderId = typeof orderData === "object" && "id" in orderData ? String(orderData.id) : "";

        if (!orderId) {
          return null;
        }

        return { id: orderId };
      } catch {
        return null;
      }
    },
    [venue.id],
  );

  const syncRemoteOrder = useCallback(
    async (
      orderId: string,
      items?: OrderedRuntimeItem[],
      _status?: "pending" | "paid" | "new",
      notes?: string,
    ): Promise<boolean> => {
      try {
        const body: { items?: KitchenOrderItem[]; notes?: string; total?: number; subtotal?: number } = {};

        if (items) {
          body.items = toKitchenOrderItems(items) as never;

          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

          body.total = total;
          body.subtotal = total;
        }

        if (notes !== undefined) {
          body.notes = notes;
        }

        await ordersApi.update(venue.id, orderId, body);
        void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "orders", venue.id] });

        return true;
      } catch {
        return false;
      }
    },
    [queryClient, toKitchenOrderItems, venue.id],
  );

  const handleBeginOrder = useCallback(async (): Promise<void> => {
    if (!selectedTableElement || !isSelectedTableAvailable) {
      return;
    }

    const tableLabel =
      selectedTableElement.type === "table" && selectedTableElement.label
        ? selectedTableElement.label
        : `Table ${selectedTableElement.type === "table" ? selectedTableElement.tableNumber : selectedTableElement.id}`;
    const createdOrder = await createRemoteOrder(selectedTableElement.id, tableLabel);

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
        guestCount: Object.prototype.hasOwnProperty.call(prev, selectedTableElement.id)
          ? (prev[selectedTableElement.id].guestCount ?? selectedTableElement.seats)
          : selectedTableElement.seats,
      },
    }));
    setTableOrderItems((prev) => ({
      ...prev,
      [selectedTableElement.id]: prev[selectedTableElement.id] ?? [],
    }));
    setIsMenuDockOpen(true);
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

      const updated = await syncRemoteOrder(selectedTableOrderId, nextItems, "new");

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
    setIsMenuDockOpen(false);
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

      const updated = await syncRemoteOrder(selectedTableOrderId, nextItems, "new");

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
    if (!selectedTableOrderId || isSelectedTableAvailable || !selectedTableElement) {
      return;
    }

    const noteValue = tableOrderNotes[selectedTableElement.id] ?? "";

    await syncRemoteOrder(selectedTableOrderId, undefined, undefined, noteValue);
  }, [isSelectedTableAvailable, selectedTableElement, selectedTableOrderId, syncRemoteOrder, tableOrderNotes]);

  const selectedTableOrderTotal = selectedTableOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const dynamicPanelPlacement = useMemo<"left" | "right" | "top" | "bottom">(() => {
    if (!clickCoords) {
      return isDesktopUp ? "right" : "bottom";
    }

    const spaceLeft = clickCoords.x;
    const spaceRight = window.innerWidth - clickCoords.x;
    const spaceTop = clickCoords.y;
    const spaceBottom = window.innerHeight - clickCoords.y;

    const maxSpace = Math.max(spaceLeft, spaceRight, spaceTop, spaceBottom);

    if (maxSpace === spaceLeft) {
      return "left";
    }

    if (maxSpace === spaceRight) {
      return "right";
    }

    if (maxSpace === spaceTop) {
      return "top";
    }

    return "bottom";
  }, [clickCoords, isDesktopUp]);

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

  const orderNoteFieldId = "waiter-order-note";

  return (
    <div className="relative flex h-full min-h-0 flex-col p-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 touch-pan-x touch-pan-y overflow-x-auto overflow-y-auto">
          <div className="mx-auto flex min-h-full min-w-max flex-col justify-center p-2">
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
                handleElementPointerDown(id, e);
              }}
            />
          </div>
        </div>
      </div>
      {selectedTableElement && (
        <div
          className={cn(
            "pointer-events-none absolute z-20 flex",
            dynamicPanelPlacement === "right" && "inset-y-4 right-4 items-start justify-end",
            dynamicPanelPlacement === "left" && "inset-y-4 left-4 items-start justify-start",
            dynamicPanelPlacement === "top" && "inset-x-4 top-4 items-start justify-center",
            dynamicPanelPlacement === "bottom" && "inset-x-4 bottom-4 items-end justify-center",
          )}
        >
          <div
            className={cn(
              "max-h-[calc(100vh-8rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-border-default bg-surface-primary p-4 shadow-lg transition-opacity duration-200",
              panelReady ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            )}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-primary">{selectedTableName}</h3>
                <p className="text-sm text-text-secondary">
                  {t("waiterDashboard.tableSeats", { seats: selectedTableSeats ?? "-" })}
                  {selectedTableOccupationTime && (
                    <span className="ml-2 text-text-tertiary">
                      ({t("waiterDashboard.occupiedFor", { time: selectedTableOccupationTime })})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {!isSelectedTableAvailable && (
                  <Button
                    type="button"
                    variant={isMenuDockOpen ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      setIsMenuDockOpen((open) => !open);
                    }}
                  >
                    {t("waiterDashboard.addItem")}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 shrink-0 text-status-error-text before:absolute before:-inset-4 md:before:inset-0"
                  onClick={handleClosePanel}
                  aria-label={t("waiterDashboard.closePanel")}
                >
                  <IoIosCloseCircleOutline className="h-7 w-7" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
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
                  <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
                    {selectedTableOrderItems.length === 0 ? (
                      <span>{t("waiterDashboard.noItemsYet")}</span>
                    ) : (
                      <div className="space-y-3 sm:space-y-1">
                        {selectedTableOrderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 sm:gap-2">
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
                    <label htmlFor={orderNoteFieldId} className="text-sm text-text-secondary">
                      {t("waiterDashboard.orderNoteLabel")}
                    </label>
                    <textarea
                      id={orderNoteFieldId}
                      rows={2}
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
                      className="w-full rounded-md border border-border-default bg-surface-primary px-4 py-3 text-sm text-text-primary"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setIsUnlockModalOpen(true);
                    }}
                  >
                    {t("waiterDashboard.confirmPayment")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {selectedTableElement && !isSelectedTableAvailable && (
        <WaiterMenuDock
          isOpen={isMenuDockOpen}
          placement={isDesktopUp ? "right" : "bottom"}
          title={t("waiterDashboard.addItemModalTitle")}
          emptyLabel={t("waiterDashboard.addItemModalEmpty")}
          closeLabel={t("waiterDashboard.closePanel")}
          items={menuItems}
          onAddItem={(itemId) => {
            void handleAddItemToOrder(itemId);
          }}
          onClose={() => {
            setIsMenuDockOpen(false);
          }}
        />
      )}

      <Modal
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
        }}
        title={t("waiterDashboard.confirmPaymentModalTitle")}
        size="sm"
      >
        <div className="flex flex-col gap-6">
          <p className="text-sm text-text-secondary">{t("waiterDashboard.confirmPaymentModalDescription")}</p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsUnlockModalOpen(false);
              }}
            >
              {t("waiterDashboard.confirmPaymentModalCancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                void handleConfirmPayment();
                setIsUnlockModalOpen(false);
              }}
            >
              {t("waiterDashboard.confirmPaymentModalConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
