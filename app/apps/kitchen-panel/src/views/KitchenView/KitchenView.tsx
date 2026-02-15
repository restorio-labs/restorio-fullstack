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
  useMediaQuery,
} from "@restorio/ui";
import { useCallback, useMemo, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import {
  DragOverlay,
  DropPlaceholder,
  DropZoneBar,
  useColumnNavigation,
  useOrdersDragAndDrop,
  useOrdersState,
  useViewMode,
  type DropZone,
  type UseOrdersStateReturn,
} from "../../features/orders";
import { useRestaurantSelection, useTenantRestaurants } from "../../features/restaurants";
import { orders as initialOrders, statusConfig as statusConfigRaw } from "../../mocks/orders";

const getRestaurantLabel = (restaurant: Restaurant): string => {
  return restaurant.address.city ? `${restaurant.name} - ${restaurant.address.city}` : restaurant.name;
};

type StatusKey = keyof typeof statusConfigRaw;
type StatusIconKey = (typeof statusConfigRaw)[StatusKey]["iconKey"];

const iconPaths: Record<StatusIconKey, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  clock: <path d="M12 6v6l4 2" />,
  check: <path d="M6 12l4 4 8-8" />,
};

export const KitchenView = (): ReactElement => {
  const params = useParams();
  const tenantId = params.tenantId ?? "demo-tenant";

  const { restaurants, defaultRestaurantId } = useTenantRestaurants(tenantId);
  const { selectedRestaurantId, setSelectedRestaurantId } = useRestaurantSelection(
    tenantId,
    restaurants,
    defaultRestaurantId,
  );

  const ordersState: UseOrdersStateReturn = useOrdersState(initialOrders);
  const { orders, moveOrder } = ordersState;
  const { viewMode, toggleViewMode } = useViewMode(tenantId);

  const isTablet = useMediaQuery("(min-width: 768px)");
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const useHorizontalLayout = (isTablet && isLandscape && viewMode === "sliding") || viewMode === "sliding";

  const statusConfig = useMemo(() => statusConfigRaw, []);
  const statusKeys = useMemo(() => Object.keys(statusConfig) as StatusKey[], [statusConfig]);

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
    ? `Active restaurant: ${selectedRestaurant.name}`
    : "Select a restaurant to begin.";

  const dropZones: DropZone[] = useMemo(
    () =>
      statusKeys.map((key) => ({
        id: key,
        label: statusConfig[key].label,
        iconPath: iconPaths[statusConfig[key].iconKey],
        className: statusConfig[key].indicatorClassName,
      })),
    [statusKeys, statusConfig],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-surface-primary">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Text as="h1" variant="h3" weight="semibold">
              Kitchen Orders
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {headerDescription}
            </Text>
          </div>
          <nav aria-label="Kitchen panel controls">
            <Stack direction="row" spacing="md" align="center">
              <Button
                variant="secondary"
                size="md"
                onClick={toggleViewMode}
                className="flex items-center gap-2"
                aria-label={`Switch to ${viewMode === "sliding" ? "all orders" : "sliding"} view`}
              >
                <Icon size="md" viewBox="0 0 24 24">
                  {viewMode === "sliding" ? (
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                  ) : (
                    <path d="M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v5H3v-5z" />
                  )}
                </Icon>
                <Text as="span" variant="body-sm" weight="medium">
                  {viewMode === "sliding" ? "All View" : "Sliding"}
                </Text>
              </Button>
              {showRestaurantSelect && (
                <div className="min-w-56">
                  <Select
                    label="Restaurant"
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

      <div className="flex-1 overflow-hidden relative">
        <OrdersBoard
          ref={boardRef}
          ariaLabel="Kitchen orders board"
          orientation={useHorizontalLayout ? "horizontal" : "vertical"}
          enableSnapScroll={useHorizontalLayout}
          columnsClassName={useHorizontalLayout ? undefined : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}
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
                label={config.label}
                ariaLabel={config.ariaLabel}
                zoneId={statusKey}
                enableSnapScroll={useHorizontalLayout}
                minWidth={useHorizontalLayout ? "400px" : undefined}
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
              >
                {ordersForStatus.map((order, index) => {
                  const isDragging = dragState.isDragging && dragState.draggedItemId === order.id;
                  const canMoveUp = index > 0;
                  const canMoveDown = index < ordersForStatus.length - 1;

                  return (
                    <OrderCard
                      key={order.id}
                      id={order.id}
                      toggleLabel={`Toggle details for order ${order.id}`}
                      dragHandleLabel={`Drag order ${order.id}`}
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
                      moveUpLabel={`Move ${order.id} up`}
                      moveDownLabel={`Move ${order.id} down`}
                      summary={
                        <Stack direction="row" align="center" justify="between" spacing="sm" className="w-full">
                          <Stack spacing="xs" className="min-w-0 flex-1">
                            <Text as="p" variant="body-lg" weight="semibold" className="truncate">
                              {order.id}
                            </Text>
                            <Text as="p" variant="body-sm" className="text-text-secondary">
                              {order.table} · {order.items.length} items
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
                            Items
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
                                    className="text-text-secondary"
                                  >
                                    {modifier.modifierId}
                                  </Text>
                                ))}
                              </Text>
                            ))}
                          </Box>
                          {order.notes && (
                            <Box className="flex flex-col items-start gap-2">
                              <Text as="p" variant="body-sm" weight="medium">
                                Notes:
                              </Text>
                              <Text as="p" variant="body-sm" className="text-text-secondary ml-2">
                                {order.notes}
                              </Text>
                            </Box>
                          )}
                        </Stack>
                      }
                    />
                  );
                })}
                {shouldShowPlaceholder && draggedOrder && (
                  <DropPlaceholder
                    orderId={draggedOrder.id}
                    table={draggedOrder.table}
                    itemCount={draggedOrder.items.length}
                    time={draggedOrder.time}
                  />
                )}
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
                    {draggedOrder.table} · {draggedOrder.items.length} items
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
    </div>
  );
};
