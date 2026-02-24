import type { AppSlug } from "@restorio/types";
import type { ReactElement } from "react";

import { Dropdown } from "./overlays";
import { Button, Text } from "./primitives";

const CHOOSE_APP_ITEMS: { slug: AppSlug; label: string }[] = [
  { slug: "admin-panel", label: "Admin panel" },
  { slug: "kitchen-panel", label: "Kitchen panel" },
  { slug: "waiter-panel", label: "Waiter panel" },
];

export interface ChooseAppProps {
  onSelectApp: (slug: AppSlug) => void;
  variant?: "buttons" | "dropdown";
  value?: AppSlug;
}

export const ChooseApp = ({ onSelectApp, variant = "buttons", value }: ChooseAppProps): ReactElement => {
  if (variant === "dropdown") {
    return (
      <Dropdown
        trigger={
          <Button variant="primary" size="sm" className="w-max[300px] px-2 py-1 text-xs">
            {CHOOSE_APP_ITEMS.find(({ slug }) => slug === value)?.label}
          </Button>
        }
        placement="bottom-end"
        className="min-w-[100px]"
      >
        <div className="p-1">
          {CHOOSE_APP_ITEMS.filter(({ slug }) => slug !== value).map(({ slug, label }) => (
            <button
              key={slug}
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-xs text-text-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus"
              onClick={() => onSelectApp(slug)}
            >
              {label}
            </button>
          ))}
        </div>
      </Dropdown>
    );
  }

  return (
    <div className="text-center">
      <Text variant="h2" weight="bold" className="mb-3">
        You’re logged in
      </Text>
      <Text variant="body-lg" className="mb-8 text-text-secondary">
        Choose where you want to go next.
      </Text>

      <div className="mx-auto grid max-w-md grid-cols-1 gap-3">
        {CHOOSE_APP_ITEMS.map(({ slug, label }) => (
          <Button
            key={slug}
            size="lg"
            variant={slug === "admin-panel" ? "primary" : "secondary"}
            onClick={() => onSelectApp(slug)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
