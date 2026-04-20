import type { TenantMenuItem } from "@restorio/types";
import { Button, cn, Modal, Text, useI18n } from "@restorio/ui";
import { useState, type ReactElement } from "react";

interface MenuItemCardProps {
  item: TenantMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  browseOnly?: boolean;
}

export const MenuItemCard = ({
  item,
  quantity,
  onAdd,
  onRemove,
  browseOnly = false,
}: MenuItemCardProps): ReactElement => {
  const { t } = useI18n();
  const [detailOpen, setDetailOpen] = useState(false);

  const priceLabel = `${item.price.toFixed(2)} ${t("common.currency")}`;

  return (
    <>
      <div
        className={cn(
          "flex gap-2 rounded-lg border border-border-default bg-surface-primary p-2 sm:gap-3 sm:p-3",
          browseOnly ? "" : "items-stretch",
        )}
      >
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className={cn(
            "flex min-h-0 min-w-0 flex-1 items-center gap-2 rounded-md text-start outline-none ring-border-focus focus-visible:ring-2 sm:gap-3",
            browseOnly && "w-full",
          )}
          aria-label={t("menuItem.openDetailsAria", { name: item.name })}
        >
          <div className="relative aspect-square w-[min(260px,42vw)] shrink-0 overflow-hidden rounded-md bg-surface-secondary sm:w-[260px]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex max-w-[min(15rem,46vw)] ml-2 w-full shrink-0 flex-col items-stretch justify-center gap-2 py-0.5 sm:max-w-[17.5rem]">
            {item.promoted ? (
              <div className="flex w-full justify-end">
                <span className="inline-flex w-fit max-w-full shrink-0 items-center rounded-md border-2 border-status-promoted-border bg-status-promoted-background px-3 py-1.5 text-base font-semibold leading-tight text-status-promoted-text shadow-sm">
                  {t("order.promotedBadge")}
                </span>
              </div>
            ) : null}
            <Text as="span" variant="h4" weight="medium" className="line-clamp-2 text-start text-text-primary">
              {item.name}
            </Text>
            <Text as="span" variant="h4" weight="semibold" className="text-start text-text-primary">
              {priceLabel}
            </Text>
            {item.desc?.trim() ? (
              <Text as="span" variant="body-md" className="line-clamp-1 text-text-tertiary">
                {t("menuItem.tapForDescription")}
              </Text>
            ) : null}
          </div>
        </button>

        {!browseOnly ? (
          <div className="flex shrink-0 flex-row items-center gap-1.5 self-center pr-0.5">
            {quantity > 0 ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRemove()}
                  aria-label={t("menuItem.removeAria", { name: item.name })}
                  className="h-8 w-8 !p-0"
                >
                  −
                </Button>
                <span className="w-7 min-w-[1.75rem] text-center text-base font-semibold tabular-nums">{quantity}</span>
              </>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAdd()}
              aria-label={t("menuItem.addAria", { name: item.name })}
              className="h-8 w-8 !p-0"
            >
              +
            </Button>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={item.name}
        size="xl"
        closeButtonAriaLabel={t("menuItem.closeDetailsModal")}
      >
        <div className="flex w-full flex-col items-center gap-5">
          {item.imageUrl ? (
            <div className="flex w-full justify-center">
              <div className="overflow-hidden rounded-lg bg-surface-secondary">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="mx-auto max-h-[min(420px,55vh)] w-auto max-w-full object-contain"
                />
              </div>
            </div>
          ) : null}
          {item.desc?.trim() ? (
            <Text
              as="p"
              variant="h3"
              align="center"
              className="w-full max-w-prose whitespace-pre-wrap text-text-primary"
            >
              {item.desc.trim()}
            </Text>
          ) : (
            <Text
              as="p"
              variant="body-lg"
              align="center"
              className="w-full max-w-prose text-text-secondary"
            >
              {t("menuItem.noDescription")}
            </Text>
          )}
          <Text
            as="p"
            variant="h3"
            weight="semibold"
            align="center"
            className="w-full text-text-primary"
          >
            {priceLabel}
          </Text>
        </div>
      </Modal>
    </>
  );
};
