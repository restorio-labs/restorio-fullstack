import { type Restaurant, OrderStatus, type OrderItem, type SelectedModifier } from "@restorio/types";
import {
  Box,
  Button,
  Icon,
  OrderCard,
  OrdersBoard,
  Select,
  Stack,
  StatusColumn,
  Text,
  useI18n,
  useMediaQuery,
  Loader,
} from "@restorio/ui";
import { logger } from "@restorio/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { api } from "../../api/client";
import { statusConfig as statusConfigRaw } from "../../config/orderStatuses";
import {
  DragOverlay,
  DropPlaceholder,
  DropZoneBar,
  RejectionModal,
  VirtualizedOrderList,
  useColumnNavigation,
  useKitchenWebSocket,
  useOrdersDragAndDrop,
  useOrdersState,
  useViewMode,
  type DropZone,
  type UseOrdersStateReturn,
} from "../../features/orders";
import { useRestaurantSelection, useTenantRestaurants } from "../../features/restaurants";

const getRestaurantLabel = (restaurant: Restaurant): string => {
  return restaurant.address.city ? `${restaurant.name} - ${restaurant.address.city}` : restaurant.name;
};

type StatusKey = keyof typeof statusConfigRaw;
type StatusIconKey = (typeof statusConfigRaw)[StatusKey]["iconKey"] | "undo";

const iconPaths: Record<StatusIconKey, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  clock: <path d="M12 6v6l4 2" />,
  check: <path d="M6 12l4 4 8-8" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  undo: <path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5" />,
};

const DEFAULT_REJECTION_LABELS = [
  "Brak składników",
  "Kuchnia zamknięta",
  "Zbyt duże obciążenie",
  "Pozycja niedostępna",
  "Inne",
];

export const KitchenView = (): ReactElement => {
  const params = useParams();
  const tenantId = params.tenantId ?? "";
  const { t } = useI18n();

  const { restaurants, defaultRestaurantId } = useTenantRestaurants(tenantId);
  const { selectedRestaurantId, setSelectedRestaurantId } = useRestaurantSelection(
    tenantId,
    restaurants,
    defaultRestaurantId,
  );

  const ordersState: UseOrdersStateReturn = useOrdersState(selectedRestaurantId);
  const { orders, moveOrder, approveOrder, rejectOrder, markReady, refundOrder, isLoading } = ordersState;
  const { viewMode, toggleViewMode } = useViewMode(tenantId);

  const { status: wsStatus } = useKitchenWebSocket(selectedRestaurantId);

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);

  const { data: kitchenConfigData } = useQuery({
    queryKey: ["kitchen-config", selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) {
        return null;
      }
      const response = await api.orders.getKitchenConfig(selectedRestaurantId);

      return response.data;
    },
    enabled: Boolean(selectedRestaurantId),
  });

  const rejectionLabels = kitchenConfigData?.rejectionLabels ?? DEFAULT_REJECTION_LABELS;

  const isTablet = useMediaQuery("(min-width: 768px)");
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const useHorizontalLayout = (isTablet && isLandscape && viewMode === "sliding") || viewMode === "sliding";

  const statusConfig = useMemo(() => statusConfigRaw, []);
  const statusKeys = useMemo(() => Object.keys(statusConfig) as (keyof typeof statusConfig)[], [statusConfig]);

  const boardRef = useColumnNavigation(statusKeys, useHorizontalLayout);

  const { dragState, getDragHandleProps, draggedOrder } = useOrdersDragAndDrop(orders, moveOrder);

  const handleDropZoneClick = useCallback(
    (zoneId: string): void => {
      if (dragState.draggedItemId) {
        moveOrder(dragState.draggedItemId, zoneId as StatusKey);
      }
    },
    [dragState.draggedItemId, moveOrder],
  );

  const handleOpenRejection = useCallback((orderId: string): void => {
    setRejectingOrderId(orderId);
    setRejectionModalOpen(true);
  }, []);

  const handleConfirmRejection = useCallback(
    (orderId: string, reason: string): void => {
      rejectOrder(orderId, reason);
    },
    [rejectOrder],
  );

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId],
  );

  const restaurantOptions = useMemo(
    () => restaurants.map((restaurant) => ({ value: restaurant.id, label: getRestaurantLabel(restaurant) })),
    [restaurants],
  );

  const showRestaurantSelect = restaurants.length > 1;
  const headerDescription = selectedRestaurant
    ? t("kitchen.activeRestaurant", { name: selectedRestaurant.name })
    : t("kitchen.selectRestaurant");

  const dropZones: DropZone[] = useMemo(
    () =>
      statusKeys.map((key) => ({
        id: key,
        label: t(statusConfig[key].labelKey),
        iconPath: iconPaths[statusConfig[key].iconKey],
        className: statusConfig[key].indicatorClassName,
      })),
    [statusKeys, statusConfig, t],
  );

  const wsIndicator =
    wsStatus === "connected"
      ? "bg-status-success-background"
      : wsStatus === "reconnecting"
        ? "bg-status-warning-background"
        : "bg-status-error-background";

  logger.debug(`wsStatus: ${wsStatus}\nwsIndicator: ${wsIndicator}`); // const wsIcon = wsStatus === "connected" ? "check" : wsStatus === "reconnecting" ? "clock" : "x";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-surface-primary">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Text as="h1" variant="h3" weight="semibold">
                {t("kitchen.title")}
              </Text>
            </div>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {headerDescription}
            </Text>
          </div>
          <nav aria-label={t("aria.kitchenControls")}>
            <Stack direction="row" spacing="md" align="center">
              <Button
                variant="secondary"
                size="md"
                onClick={toggleViewMode}
                className="flex items-center gap-2"
                aria-label={t("aria.switchViewMode", {
                  mode: viewMode === "sliding" ? t("kitchen.viewMode.all") : t("kitchen.viewMode.sliding"),
                })}
              >
                <Icon size="md" viewBox="0 0 24 24">
                  {viewMode === "sliding" ? (
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                  ) : (
                    <path d="M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v5H3v-5z" />
                  )}
                </Icon>
                <Text as="span" variant="body-sm" weight="medium">
                  {viewMode === "sliding" ? t("kitchen.viewMode.all") : t("kitchen.viewMode.sliding")}
                </Text>
              </Button>
              {showRestaurantSelect && (
                <div className="min-w-56">
                  <Select
                    label={t("kitchen.restaurant")}
                    value={selectedRestaurantId ?? ""}
                    onChange={(event) => setSelectedRestaurantId(event.target.value)}
                    options={restaurantOptions}
                  />
                </div>
              )}
            </Stack>
          </nav>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader />
          <Text as="p" variant="body-md" className="text-text-secondary">
            {t("common.loading")}
          </Text>
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 overflow-hidden relative h-full">
          <OrdersBoard
            ref={boardRef}
            ariaLabel={t("aria.ordersBoard")}
            orientation={useHorizontalLayout ? "horizontal" : "vertical"}
            enableSnapScroll={useHorizontalLayout}
            columnsClassName={useHorizontalLayout ? undefined : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}
          >
            {statusKeys.map((statusKey) => {
              const config = statusConfig[statusKey];
              const ordersForStatus = orders.filter((order) => order.status === statusKey);
              const isActiveDropZone = dragState.isDragging && dragState.activeDropZoneId === statusKey;
              const isSourceColumn = draggedOrder?.status === statusKey;
              const shouldShowPlaceholder = isActiveDropZone && !isSourceColumn;
              const shouldDefaultExpand = statusKey === OrderStatus.PREPARING;

              return (
                <StatusColumn
                  key={statusKey}
                  label={t(config.labelKey)}
                  ariaLabel={t(config.ariaLabelKey)}
                  zoneId={statusKey}
                  enableSnapScroll={useHorizontalLayout}
                  minWidth={useHorizontalLayout ? "380px" : undefined}
                  isActive={isActiveDropZone}
                  statusIndicator={
                    <Box
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${config.indicatorClassName}`}
                      aria-hidden="true"
                    >
                      <Icon size="md" className={config.iconClassName} viewBox="0 0 24 24">
                        {iconPaths[config.iconKey]}
                      </Icon>
                    </Box>
                  }
                  ordersClassName="!overflow-visible !p-0 !gap-0"
                >
                  <VirtualizedOrderList
                    count={ordersForStatus.length}
                    estimateSize={120}
                    renderItem={(index) => {
                      const order = ordersForStatus[index];
                      const isDragging = dragState.isDragging && dragState.draggedItemId === order.id;
                      const canMoveUp = index > 0;
                      const canMoveDown = index < ordersForStatus.length - 1;
                      const isNewOrder = order.status === OrderStatus.NEW;
                      const isPreparingOrder = order.status === OrderStatus.PREPARING;
                      const isRejected = order.status === OrderStatus.REJECTED;

                      return (
                        <OrderCard
                          key={order.id}
                          id={order.id}
                          toggleLabel={t("aria.toggleOrderDetails", { id: order.id })}
                          dragHandleLabel={t("aria.dragOrder", { id: order.id })}
                          isDragging={isDragging}
                          dragHandleProps={getDragHandleProps(order.id)}
                          showReorderButtons
                          canMoveUp={canMoveUp}
                          canMoveDown={canMoveDown}
                          defaultExpanded={shouldDefaultExpand}
                          onMoveUp={() => {
                            (ordersState.moveOrderUp as (id: string) => void)(order.id);
                          }}
                          onMoveDown={() => {
                            (ordersState.moveOrderDown as (id: string) => void)(order.id);
                          }}
                          moveUpLabel={t("aria.moveOrderUp", { id: order.id })}
                          moveDownLabel={t("aria.moveOrderDown", { id: order.id })}
                          summary={
                            <Stack direction="row" align="center" justify="between" spacing="sm" className="w-full">
                              <Stack spacing="xs" className="min-w-0 flex-1">
                                <Text as="p" variant="body-lg" weight="semibold" className="truncate">
                                  {order.id}
                                </Text>
                                <Text as="p" variant="body-sm" className="text-text-secondary">
                                  {order.table} · {order.items.length} {t("common.items")}
                                </Text>
                              </Stack>
                              <Text as="span" variant="body-sm" weight="medium" className="text-text-secondary">
                                {order.time}
                              </Text>
                            </Stack>
                          }
                          details={
                            <Stack spacing="sm">
                              <Text as="h3" variant="body-sm" weight="semibold">
                                {t("kitchen.items")}
                              </Text>
                              <Box as="ul" className="list-disc pl-4 text-text-secondary">
                                {order.items.map((item: OrderItem) => (
                                  <Text as="li" variant="body-md" key={item.id} className="text-text-secondary">
                                    {item.quantity}x {item.name}
                                    {item.selectedModifiers.map((modifier: SelectedModifier) => (
                                      <Text
                                        as="span"
                                        variant="body-md"
                                        key={modifier.modifierId}
                                        className="text-text-secondary ml-1"
                                      >
                                        (+{modifier.name})
                                      </Text>
                                    ))}
                                  </Text>
                                ))}
                              </Box>
                              {order.notes && (
                                <Box className="flex flex-col items-start gap-2">
                                  <Text as="p" variant="body-sm" weight="medium">
                                    {t("kitchen.notes")}
                                  </Text>
                                  <Text as="p" variant="body-sm" className="text-text-secondary ml-2">
                                    {order.notes}
                                  </Text>
                                </Box>
                              )}
                              {isRejected && order.rejectionReason && (
                                <Box className="rounded-md border border-status-error-border bg-status-error-background px-3 py-2">
                                  <Text as="p" variant="body-sm" className="text-status-error-text">
                                    {order.rejectionReason}
                                  </Text>
                                </Box>
                              )}
                              <Stack direction="row" spacing="sm" className="pt-2">
                                {isNewOrder && (
                                  <>
                                    <Button size="sm" variant="primary" onClick={() => approveOrder(order.id)}>
                                      {t("orders.actions.approve")}
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleOpenRejection(order.id)}>
                                      {t("orders.actions.reject")}
                                    </Button>
                                  </>
                                )}
                                {isPreparingOrder && (
                                  <Button size="sm" variant="primary" onClick={() => markReady(order.id)}>
                                    {t("orders.actions.markReady")}
                                  </Button>
                                )}
                                {isRejected && (
                                  <Button size="sm" variant="secondary" onClick={() => refundOrder(order.id)}>
                                    {t("orders.actions.refund")}
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          }
                        />
                      );
                    }}
                    footer={
                      shouldShowPlaceholder && draggedOrder ? (
                        <DropPlaceholder
                          orderId={draggedOrder.id}
                          table={draggedOrder.table}
                          itemCount={draggedOrder.items.length}
                          time={draggedOrder.time}
                        />
                      ) : undefined
                    }
                  />
                </StatusColumn>
              );
            })}
          </OrdersBoard>

          <DragOverlay isVisible={dragState.isDragging} position={dragState.currentPosition}>
            {draggedOrder && (
              <Box className="w-96 rounded-card border-2 border-border-focus bg-surface-primary shadow-2xl">
                <Stack direction="row" align="center" spacing="sm" className="px-5 py-4">
                  <Stack spacing="xs" className="min-w-0 flex-1">
                    <Text as="p" variant="body-lg" weight="semibold" className="truncate">
                      {draggedOrder.id}
                    </Text>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      {draggedOrder.table} · {draggedOrder.items.length} {t("common.items")}
                    </Text>
                  </Stack>
                  <Text as="span" variant="body-sm" weight="medium" className="text-text-secondary">
                    {draggedOrder.time}
                  </Text>
                </Stack>
              </Box>
            )}
          </DragOverlay>

          <DropZoneBar
            isVisible={dragState.isDragging}
            zones={dropZones}
            activeZoneId={dragState.activeDropZoneId}
            onZoneClick={handleDropZoneClick}
          />
        </div>
      )}

      <RejectionModal
        isOpen={rejectionModalOpen}
        orderId={rejectingOrderId ?? ""}
        labels={rejectionLabels}
        onConfirm={handleConfirmRejection}
        onClose={() => setRejectionModalOpen(false)}
      />
    </div>
  );
};
