import { Button, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import type { MobileOrderViewModel } from "../view-models";

import { MobileMenuScreen } from "./MobileMenuScreen";

export interface MobileOrderScreenProps {
  viewModel: MobileOrderViewModel;
  onOpenItem?: (itemId: string) => void;
  onAddItem?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onOpenCart?: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export const MobileOrderScreen = ({
  viewModel,
  onOpenItem,
  onAddItem,
  onRemoveItem,
  onOpenCart,
  onSubmit,
  disabled = false,
}: MobileOrderScreenProps): ReactElement => {
  const submittingLabel = viewModel.submittingLabel?.trim();
  const isSubmitting = viewModel.isSubmitting ?? false;

  return (
    <>
      <header className="sticky top-0 z-[1] border-b border-border-default bg-surface-primary px-4 py-3 text-center">
        <Text as="p" variant="caption" className="text-text-secondary">
          {viewModel.tableCaption}
        </Text>
        <Text as="h1" variant="h4" weight="bold" className="text-balance text-center">
          {viewModel.title}
        </Text>
        <Button type="button" variant="secondary" size="sm" disabled={disabled || !onOpenCart} onClick={onOpenCart}>
          {viewModel.cartButtonLabel}
        </Button>
      </header>
      <MobileMenuScreen
        viewModel={{
          title: viewModel.title,
          subtitle: viewModel.tableCaption,
          backLabel: "",
          emptyTitle: viewModel.summaryTitle,
          emptyDescription: "",
          categories: viewModel.categories,
        }}
        onOpenItem={onOpenItem}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
        orderMode
        hideHeader
        disabled={disabled}
      />
      <section className="mx-auto mb-6 w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-border-default bg-surface-primary p-4">
        <Text as="h2" variant="body-lg" weight="semibold" className="mb-3 text-center">
          {viewModel.summaryTitle}
        </Text>
        <dl className="space-y-2">
          {viewModel.summaryLines.map((line) => (
            <div key={line.id} className="flex items-center justify-between gap-4">
              <Text
                as="dt"
                variant={line.emphasized ? "body-md" : "body-sm"}
                weight={line.emphasized ? "bold" : undefined}
              >
                {line.label}
              </Text>
              <Text
                as="dd"
                variant={line.emphasized ? "body-md" : "body-sm"}
                weight={line.emphasized ? "bold" : undefined}
              >
                {line.value}
              </Text>
            </div>
          ))}
        </dl>
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-4"
          disabled={disabled || isSubmitting || !onSubmit}
          onClick={onSubmit}
        >
          {isSubmitting && submittingLabel ? submittingLabel : viewModel.submitLabel}
        </Button>
      </section>
    </>
  );
};
