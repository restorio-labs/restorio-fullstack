import { Box, Icon, OrderCard, OrdersBoard, Select, Stack, StatusColumn, Text } from "@restorio/ui";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { useTenantRestaurants, type Restaurant } from "../hooks/useTenantRestaurants";
import { orders, statusConfig as statusConfigRaw } from "../mocks/orders";

const columnsPerView = 3 as const;

const columnGridClassName = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
} as const satisfies Record<number, string>;

const getRestaurantLabel = (restaurant: Restaurant): string => {
  return restaurant.location ? `${restaurant.name} - ${restaurant.location}` : restaurant.name;
};

type StatusKey = keyof typeof statusConfigRaw;
type StatusIconKey = (typeof statusConfigRaw)[StatusKey]["iconKey"];

const iconPaths: Record<StatusIconKey, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  clock: <path d="M12 6v6l4 2" />,
  check: <path d="M6 12l4 4 8-8" />,
};

export const KitchenPanelView = (): ReactElement => {
  const params = useParams();
  const tenantId = params.tenantId ?? "demo-tenant";
  const { restaurants, defaultRestaurantId } = useTenantRestaurants(tenantId);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const storageKey = `kitchen-panel:tenant:${tenantId}:restaurant`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const storedIsValid = stored ? restaurants.some((restaurant) => restaurant.id === stored) : false;
    const fallbackId = restaurants.length === 1 ? (restaurants[0]?.id ?? null) : defaultRestaurantId;
    const nextId = storedIsValid ? stored : fallbackId;

    setSelectedRestaurantId(nextId);

    if (nextId) {
      localStorage.setItem(storageKey, nextId);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [defaultRestaurantId, restaurants, storageKey]);

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
  const statusConfig = statusConfigRaw;
  const statusKeys = Object.keys(statusConfig) as StatusKey[];

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
          {showRestaurantSelect && (
            <div className="min-w-56">
              <Select
                label="Restaurant"
                value={selectedRestaurantId ?? ""}
                onChange={(event) => {
                  const nextId = event.target.value;

                  setSelectedRestaurantId(nextId);
                  localStorage.setItem(storageKey, nextId);
                }}
                options={restaurantOptions}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <OrdersBoard ariaLabel="Kitchen orders board" columnsClassName={columnGridClassName[columnsPerView]}>
          {statusKeys.map((statusKey) => {
            const config = statusConfig[statusKey];
            const ordersForStatus = orders.filter((order) => order.status === statusKey);

            return (
              <StatusColumn
                key={statusKey}
                label={config.label}
                ariaLabel={config.ariaLabel}
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
                {ordersForStatus.map((order) => (
                  <OrderCard
                    key={order.id}
                    toggleLabel={`Toggle details for order ${order.id}`}
                    dragHandleLabel={`Drag order ${order.id}`}
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
                          {order.items.map((item) => (
                            <Text as="li" variant="body-md" key={item} className="text-text-secondary">
                              {item}
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
                ))}
              </StatusColumn>
            );
          })}
        </OrdersBoard>
      </div>
    </div>
  );
};
