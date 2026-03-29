import type { AppSlug } from "@restorio/types";
import type { ReactElement } from "react";

import { cn } from "../utils";

import { Dropdown } from "./overlays";
import { Button, Text } from "./primitives";

const CHOOSE_APP_SLUGS: AppSlug[] = ["admin-panel", "kitchen-panel", "waiter-panel"];

export interface ChooseAppLabels {
  adminPanel: string;
  kitchenPanel: string;
  waiterPanel: string;
}

export interface ChooseAppProps {
  onSelectApp: (slug: AppSlug) => void;
  labels: ChooseAppLabels;
  variant?: "buttons" | "dropdown";
  value?: AppSlug;
  ariaLabel?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const ChooseApp = ({
  onSelectApp,
  labels,
  variant = "buttons",
  value,
  ariaLabel,
  className,
  title = "You’re logged in",
  subtitle = "Choose where you want to go next.",
}: ChooseAppProps): ReactElement => {
  const items = CHOOSE_APP_SLUGS.map((slug) => ({
    slug,
    label:
      slug === "admin-panel" ? labels.adminPanel : slug === "kitchen-panel" ? labels.kitchenPanel : labels.waiterPanel,
  }));

  if (variant === "dropdown") {
    return (
      <div className={cn("flex w-full justify-end", className)}>
        <Dropdown
          trigger={
            <Button
              variant="primary"
              size="sm"
              className="min-w-0 max-w-[300px] truncate px-2 py-1 text-xs"
              aria-label={ariaLabel}
            >
              {items.find(({ slug }) => slug === value)?.label}
            </Button>
          }
          placement="bottom-end"
          className="min-w-[100px]"
        >
          <div className="flex flex-col gap-0">
            {items
              .filter(({ slug }) => slug !== value)
              .map(({ slug, label }, index, arr) => {
                const isFirst = index === 0;
                const isLast = index === arr.length - 1;
                const yPadding =
                  isFirst && isLast ? "py-2.5" : isFirst ? "pt-2.5 pb-1.5" : isLast ? "pt-1.5 pb-2.5" : "py-2";

                return (
                  <button
                    key={slug}
                    type="button"
                    className={cn(
                      "w-full rounded-none px-3 text-left text-xs text-text-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus",
                      yPadding,
                    )}
                    onClick={() => onSelectApp(slug)}
                    aria-label={ariaLabel}
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        </Dropdown>
      </div>
    );
  }

  return (
    <div className={cn("text-center", className)}>
      <Text variant="h2" weight="bold" className="mt-4 mb-3 text-center">
        {title}
      </Text>
      <Text variant="body-lg" className="mb-5 text-text-secondary text-center">
        {subtitle}
      </Text>

      <div className="mx-auto grid max-w-md grid-cols-1 gap-3">
        {items.map(({ slug, label }) => (
          <Button
            key={slug}
            size="lg"
            variant={slug === "admin-panel" ? "primary" : "secondary"}
            onClick={() => onSelectApp(slug)}
            aria-label={ariaLabel}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
