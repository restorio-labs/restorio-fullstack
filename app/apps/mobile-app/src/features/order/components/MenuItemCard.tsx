import type { TenantMenuItem } from "@restorio/types";
import { Button, Text, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

interface MenuItemCardProps {
  item: TenantMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export const MenuItemCard = ({ item, quantity, onAdd, onRemove }: MenuItemCardProps): ReactElement => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-surface-primary py-3 px-5">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Text as="span" variant="body-md" weight="medium" className="truncate">
            {item.name}
          </Text>
          {item.promoted && (
            <span className="shrink-0 rounded-full bg-status-warning-bg px-2 py-0.5 text-xs font-medium text-status-promoted-text">
              {t("order.promotedBadge")}
            </span>
          )}
        </div>
        {item.desc && (
          <Text as="p" variant="body-sm" className="mt-0.5 line-clamp-2 text-text-secondary">
            {item.desc}
          </Text>
        )}
        <Text as="span" variant="body-md" weight="semibold" className="mt-1 block">
          {item.price.toFixed(2)} {t("common.currency")}
        </Text>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {quantity > 0 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRemove}
              aria-label={t("menuItem.removeAria", { name: item.name })}
              className="h-8 w-8 !p-0"
            >
              −
            </Button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          </>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={onAdd}
          aria-label={t("menuItem.addAria", { name: item.name })}
          className="h-8 w-8 !p-0"
        >
          +
        </Button>
      </div>
    </div>
  );
};
