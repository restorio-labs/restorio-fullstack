import { Button, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import type { CartItem } from "../hooks/useCart";

interface CartSummaryProps {
  items: CartItem[];
  totalAmount: number;
  onRemove: (name: string) => void;
  onUpdateQuantity: (name: string, quantity: number) => void;
}

export const CartSummary = ({ items, totalAmount, onRemove, onUpdateQuantity }: CartSummaryProps): ReactElement => {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-secondary p-4 text-center">
        <Text as="p" variant="body-sm" className="text-text-secondary">
          Koszyk jest pusty. Dodaj pozycje z menu.
        </Text>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-surface-primary">
      <div className="p-3">
        <Text as="h3" variant="body-md" weight="semibold" className="mb-2">
          Twoje zamówienie
        </Text>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Text as="span" variant="body-sm" className="truncate block">
                  {item.name}
                </Text>
                <Text as="span" variant="caption">
                  {item.unitPrice.toFixed(2)} zł × {item.quantity}
                </Text>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRemove(item.name)}
                  aria-label={`Mniej: ${item.name}`}
                  className="h-7 w-7 !p-0 text-xs"
                >
                  −
                </Button>
                <span className="w-5 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.name, item.quantity + 1)}
                  aria-label={`Więcej: ${item.name}`}
                  className="h-7 w-7 !p-0 text-xs"
                >
                  +
                </Button>
                <Text as="span" variant="body-sm" weight="semibold" className="w-16 text-right">
                  {(item.unitPrice * item.quantity).toFixed(2)} zł
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border-default px-3 py-2 flex items-center justify-between">
        <Text as="span" variant="body-md" weight="semibold">
          Razem
        </Text>
        <Text as="span" variant="body-lg" weight="bold">
          {totalAmount.toFixed(2)} zł
        </Text>
      </div>
    </div>
  );
};
