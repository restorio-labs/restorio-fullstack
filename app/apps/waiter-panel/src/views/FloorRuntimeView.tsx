import type {
  FloorCanvas as FloorCanvasType,
  Menu,
  TableDisplayInfo,
  TableRuntimeState,
  Tenant,
} from "@restorio/types";
import { Button, FloorCanvas, useI18n, useMediaQuery } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import { api } from "../api/client";

interface FloorRuntimeViewProps {
  venue: Tenant;
  tableStates?: Record<string, TableRuntimeState>;
  tableDisplayInfo?: Record<string, TableDisplayInfo>;
}

interface RuntimeMenuItem {
  id: string;
  name: string;
  price: number;
}

interface OrderedRuntimeItem extends RuntimeMenuItem {
  quantity: number;
}

export const FloorRuntimeView = ({
  venue,
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
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [tableOrderItems, setTableOrderItems] = useState<Record<string, OrderedRuntimeItem[]>>({});
  const hasCanvases = venue.floorCanvases.length > 0;

  const activeCanvas = hasCanvases
    ? (venue.floorCanvases.find((c: FloorCanvasType) => c.id === venue.activeLayoutVersionId) ?? venue.floorCanvases[0])
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
        const restaurants = await api.restaurants.list();

        if (restaurants.length === 0) {
          return [];
        }

        const restaurant = restaurants.find((candidate) => candidate.tenantId === venue.id) ?? restaurants[0];

        const menus = await api.menus.list(restaurant.id);

        if (menus.length === 0) {
          return [];
        }

        const activeMenu = menus.find((menu: Menu) => menu.isActive) ?? menus[0];

        return activeMenu.categories.flatMap((category) =>
          category.items
            .filter((item) => item.isAvailable)
            .map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
            })),
        );
      } catch {
        return [];
      }
    },
  });

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

  const selectedTableDisplayInfo = selectedTableElement ? tableDisplayInfo[selectedTableElement.id] : undefined;
  const selectedTableHasOrder =
    selectedTableDisplayInfo?.orderStatus !== undefined && selectedTableDisplayInfo.orderStatus !== "browsing";
  const isSelectedTableAvailable = Boolean(selectedTableElement) && !selectedTableHasOrder;
  const selectedTableOrderItems = selectedTableElement ? (tableOrderItems[selectedTableElement.id] ?? []) : [];

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
  }, []);

  const handleBeginOrder = useCallback((): void => {
    if (!selectedTableElement || !isSelectedTableAvailable) {
      return;
    }

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
  }, [isSelectedTableAvailable, selectedTableElement]);

  const handleAddItemToOrder = useCallback((): void => {
    if (!selectedTableElement || isSelectedTableAvailable || selectedMenuItemId.trim() === "") {
      return;
    }

    const selectedMenuItem = menuItems.find((item) => item.id === selectedMenuItemId);

    if (!selectedMenuItem) {
      return;
    }

    setTableOrderItems((prev) => {
      const existingItems = prev[selectedTableElement.id] ?? [];
      const existingItem = existingItems.find((item) => item.id === selectedMenuItem.id);

      if (!existingItem) {
        return {
          ...prev,
          [selectedTableElement.id]: [...existingItems, { ...selectedMenuItem, quantity: 1 }],
        };
      }

      return {
        ...prev,
        [selectedTableElement.id]: existingItems.map((item) =>
          item.id === selectedMenuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      };
    });
    setTableDisplayInfo((prev) => ({
      ...prev,
      [selectedTableElement.id]: {
        ...prev[selectedTableElement.id],
        orderStatus: "ordered",
      },
    }));
    setSelectedMenuItemId("");
  }, [isSelectedTableAvailable, menuItems, selectedMenuItemId, selectedTableElement]);

  const handleConfirmPayment = useCallback((): void => {
    if (!selectedTableElement || isSelectedTableAvailable) {
      return;
    }

    setTableDisplayInfo((prev) => ({
      ...prev,
      [selectedTableElement.id]: {
        ...prev[selectedTableElement.id],
        guestCount: undefined,
        orderStatus: "browsing",
      },
    }));
    setTableOrderItems((prev) => ({
      ...prev,
      [selectedTableElement.id]: [],
    }));
    setSelectedMenuItemId("");
  }, [isSelectedTableAvailable, selectedTableElement]);

  const selectedTableOrderTotal = selectedTableOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
              tableDisplayInfo={tableDisplayInfo}
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
                {isSelectedTableAvailable ? t("waiterDashboard.tableAvailable") : t("waiterDashboard.tableOccupied")}
              </div>
              {isSelectedTableAvailable ? (
                <Button type="button" variant="primary" onClick={handleBeginOrder}>
                  {t("waiterDashboard.beginOrder")}
                </Button>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-text-secondary">{t("waiterDashboard.addItemLabel")}</label>
                    <select
                      value={selectedMenuItemId}
                      onChange={(event) => setSelectedMenuItemId(event.target.value)}
                      className="rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="">{t("waiterDashboard.selectMenuItem")}</option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddItemToOrder}
                      disabled={selectedMenuItemId.trim() === "" || menuItems.length === 0}
                    >
                      {t("waiterDashboard.addItem")}
                    </Button>
                  </div>
                  <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
                    {selectedTableOrderItems.length === 0 ? (
                      <span>{t("waiterDashboard.noItemsYet")}</span>
                    ) : (
                      <div className="space-y-1">
                        {selectedTableOrderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2">
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                            <span>{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="mt-2 border-t border-border-default pt-2 font-semibold text-text-primary">
                          {t("waiterDashboard.orderTotal", { total: selectedTableOrderTotal.toFixed(2) })}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="primary" onClick={handleConfirmPayment}>
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
              {isSelectedTableAvailable ? t("waiterDashboard.tableAvailable") : t("waiterDashboard.tableOccupied")}
            </div>
            {isSelectedTableAvailable ? (
              <Button type="button" variant="primary" onClick={handleBeginOrder}>
                {t("waiterDashboard.beginOrder")}
              </Button>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-text-secondary">{t("waiterDashboard.addItemLabel")}</label>
                  <select
                    value={selectedMenuItemId}
                    onChange={(event) => setSelectedMenuItemId(event.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  >
                    <option value="">{t("waiterDashboard.selectMenuItem")}</option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddItemToOrder}
                    disabled={selectedMenuItemId.trim() === "" || menuItems.length === 0}
                  >
                    {t("waiterDashboard.addItem")}
                  </Button>
                </div>
                <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
                  {selectedTableOrderItems.length === 0 ? (
                    <span>{t("waiterDashboard.noItemsYet")}</span>
                  ) : (
                    <div className="space-y-1">
                      {selectedTableOrderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span>{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="mt-2 border-t border-border-default pt-2 font-semibold text-text-primary">
                        {t("waiterDashboard.orderTotal", { total: selectedTableOrderTotal.toFixed(2) })}
                      </div>
                    </div>
                  )}
                </div>
                <Button type="button" variant="primary" onClick={handleConfirmPayment}>
                  {t("waiterDashboard.confirmPayment")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {selectedTableElement && !isTabletUp && <div className="h-[180px] shrink-0" />}
    </div>
  );
};
