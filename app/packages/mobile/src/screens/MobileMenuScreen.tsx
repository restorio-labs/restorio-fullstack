import { Button, EmptyState, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import type { MobileMenuItemViewModel, MobileMenuViewModel } from "../view-models";

interface MobileMenuItemProps {
  item: MobileMenuItemViewModel;
  interactive: boolean;
  disabled: boolean;
  onOpen?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const MobileMenuItem = ({
  item,
  interactive,
  disabled,
  onOpen,
  onAdd,
  onRemove,
}: MobileMenuItemProps): ReactElement => (
  <article className="rounded-lg border border-border-default bg-surface-primary p-3">
    <button
      type="button"
      disabled={disabled || !onOpen}
      onClick={onOpen}
      className="grid w-full grid-cols-[5rem_minmax(0,1fr)] gap-3 rounded-md text-left outline-none ring-border-focus focus-visible:ring-2 disabled:cursor-default disabled:opacity-100"
    >
      <div className="aspect-square overflow-hidden rounded-md bg-surface-secondary">
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        {item.promoted ? (
          <span className="mb-1 inline-flex rounded-md border border-status-promoted-border bg-status-promoted-background px-2 py-0.5 text-xs font-semibold text-status-promoted-text">
            {item.promotedLabel}
          </span>
        ) : null}
        <Text as="h3" variant="body-md" weight="semibold" className="break-words">
          {item.name}
        </Text>
        {item.description ? (
          <Text as="p" variant="body-sm" className="mt-1 line-clamp-2 text-text-secondary">
            {item.description}
          </Text>
        ) : null}
        <Text as="p" variant="body-md" weight="semibold" className="mt-1">
          {item.priceLabel}
        </Text>
      </div>
    </button>
    {interactive ? (
      <div className="mt-3 flex items-center gap-2">
        {(item.quantity ?? 0) > 0 ? (
          <>
            <Button type="button" variant="secondary" size="sm" fullWidth disabled={disabled} onClick={onRemove}>
              −
            </Button>
            <span className="min-w-10 text-center font-semibold tabular-nums">{item.quantity}</span>
          </>
        ) : null}
        <Button type="button" variant="primary" size="sm" fullWidth disabled={disabled} onClick={onAdd}>
          +
        </Button>
      </div>
    ) : null}
  </article>
);

export interface MobileMenuScreenProps {
  viewModel: MobileMenuViewModel;
  onBack?: () => void;
  onOpenItem?: (itemId: string) => void;
  onAddItem?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  orderMode?: boolean;
  hideHeader?: boolean;
  disabled?: boolean;
}

export const MobileMenuScreen = ({
  viewModel,
  onBack,
  onOpenItem,
  onAddItem,
  onRemoveItem,
  orderMode = false,
  hideHeader = false,
  disabled = false,
}: MobileMenuScreenProps): ReactElement => (
  <>
    {!hideHeader ? (
      <header className="sticky top-0 z-[1] border-b border-border-default bg-surface-primary px-4 py-3 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={disabled || !onBack} onClick={onBack}>
            {viewModel.backLabel}
          </Button>
          <Text as="h1" variant="h4" weight="bold" className="w-full text-balance text-center">
            {viewModel.title}
          </Text>
          <Text as="p" variant="body-sm" className="text-pretty text-center text-text-secondary">
            {viewModel.subtitle}
          </Text>
        </div>
      </header>
    ) : null}
    <main className="mx-auto w-full max-w-2xl px-4 py-4">
      {viewModel.categories.length === 0 ? (
        <EmptyState title={viewModel.emptyTitle} description={viewModel.emptyDescription} />
      ) : (
        viewModel.categories.map((category) => (
          <section key={category.id} className="mb-6">
            <Text as="h2" variant="h4" weight="semibold" className="mb-3 text-center">
              {category.name}
            </Text>
            <div className="flex flex-col gap-2">
              {category.items.map((item) => (
                <MobileMenuItem
                  key={item.id}
                  item={item}
                  interactive={orderMode}
                  disabled={disabled}
                  onOpen={onOpenItem ? (): void => onOpenItem(item.id) : undefined}
                  onAdd={onAddItem ? (): void => onAddItem(item.id) : undefined}
                  onRemove={onRemoveItem ? (): void => onRemoveItem(item.id) : undefined}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  </>
);
