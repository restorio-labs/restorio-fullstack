import { Button, Text } from "@restorio/ui";
import type { CSSProperties, ReactElement } from "react";

import type { MobileTablesViewModel } from "../view-models";

export interface MobileTablesScreenProps {
  viewModel: MobileTablesViewModel;
  onBack?: () => void;
  onSelectTable?: (tableId: string) => void;
  disabled?: boolean;
}

export const MobileTablesScreen = ({
  viewModel,
  onBack,
  onSelectTable,
  disabled = false,
}: MobileTablesScreenProps): ReactElement => (
  <>
    <header className="sticky top-0 z-[1] border-b border-border-default bg-surface-primary px-4 py-3 text-center">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={disabled || !onBack} onClick={onBack}>
          {viewModel.backLabel}
        </Button>
        <Text as="h1" variant="h4" weight="bold" className="text-balance text-center">
          {viewModel.title}
        </Text>
        <Text as="p" variant="body-sm" className="text-pretty text-center text-text-secondary">
          {viewModel.subtitle}
        </Text>
      </div>
    </header>
    <main className="mx-auto w-full max-w-lg px-4 py-4 text-center">
      <div className="mb-4 flex flex-wrap justify-center gap-3 text-sm">
        <span className="rounded-full border border-status-success-border bg-status-success-background/50 px-3 py-1">
          {viewModel.openStatusLabel}
        </span>
        <span className="rounded-full border border-status-error-border bg-status-error-background/50 px-3 py-1">
          {viewModel.closedStatusLabel}
        </span>
      </div>
      <section>
        <Text as="h2" variant="body-md" weight="semibold" className="mb-2 text-center">
          {viewModel.floorTitle}
        </Text>
        <div className="relative h-56 overflow-hidden rounded-xl border border-border-default bg-surface-secondary">
          {viewModel.tables
            .filter((table) => table.position)
            .map((table) => {
              const style = {
                left: `${table.position!.x}%`,
                top: `${table.position!.y}%`,
              } as CSSProperties;

              return (
                <button
                  key={table.id}
                  type="button"
                  disabled={disabled || table.status === "closed" || !onSelectTable}
                  onClick={() => onSelectTable?.(table.id)}
                  style={style}
                  className={`absolute min-h-11 min-w-14 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 px-2 text-xs font-bold ${
                    table.status === "open"
                      ? "border-status-success-border bg-status-success-background"
                      : "border-status-error-border bg-status-error-background"
                  }`}
                >
                  {table.label}
                </button>
              );
            })}
        </div>
      </section>
      <section className="mt-6 rounded-xl border border-border-default bg-surface-primary p-4">
        <Text as="h2" variant="body-md" weight="semibold" className="mb-3 text-center">
          {viewModel.listTitle}
        </Text>
        {viewModel.tables.length === 0 ? (
          <Text as="p" variant="body-sm" className="text-center text-text-secondary">
            {viewModel.emptyLabel}
          </Text>
        ) : (
          <ul className="flex flex-col gap-2">
            {viewModel.tables.map((table) => (
              <li key={table.id}>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  disabled={disabled || table.status === "closed" || !onSelectTable}
                  onClick={() => onSelectTable?.(table.id)}
                >
                  {table.label} - {table.status === "open" ? viewModel.openStatusLabel : viewModel.closedStatusLabel}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  </>
);
