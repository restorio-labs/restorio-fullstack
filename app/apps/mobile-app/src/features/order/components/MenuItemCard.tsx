import type { TenantMenuItem } from "@restorio/types";
import { Button, Text } from "@restorio/ui";
import type { ReactElement } from "react";

interface MenuItemCardProps {
  item: TenantMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export const MenuItemCard = ({ item, quantity, onAdd, onRemove }: MenuItemCardProps): ReactElement => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-surface-primary p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text as="span" variant="body-md" weight="medium" className="truncate">
            {item.name}
          </Text>
          {item.promoted === 1 && (
            <span className="shrink-0 rounded-full bg-status-warning-bg px-2 py-0.5 text-xs font-medium text-status-warning-text">
              Polecane
            </span>
          )}
        </div>
        {item.desc && (
          <Text as="p" variant="body-sm" className="text-text-secondary mt-0.5 line-clamp-2">
            {item.desc}
          </Text>
        )}
        <Text as="span" variant="body-md" weight="semibold" className="mt-1 block">
          {item.price.toFixed(2)} zł
        </Text>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {quantity > 0 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRemove}
              aria-label={`Usuń ${item.name}`}
              className="h-8 w-8 !p-0"
            >
              −
            </Button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          </>
        )}
        <Button variant="primary" size="sm" onClick={onAdd} aria-label={`Dodaj ${item.name}`} className="h-8 w-8 !p-0">
          +
        </Button>
      </div>
    </div>
  );
};
