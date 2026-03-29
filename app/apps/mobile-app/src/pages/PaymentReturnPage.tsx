import { Text } from "@restorio/ui";
import type { ReactElement } from "react";

export const PaymentReturnPage = (): ReactElement => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-success-bg">
          <svg
            className="h-8 w-8 text-status-success-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Text as="h1" variant="h3" weight="bold" className="mb-2">
          Dziękujemy!
        </Text>
        <Text as="p" variant="body-md" className="text-text-secondary mb-6">
          Twoje zamówienie zostało przyjęte. Płatność jest przetwarzana przez Przelewy24.
        </Text>
        <Text as="p" variant="body-sm" className="text-text-tertiary">
          Możesz zamknąć tę stronę.
        </Text>
      </div>
    </div>
  );
};
