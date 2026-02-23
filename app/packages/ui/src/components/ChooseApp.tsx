import type { AppSlug } from "@restorio/types";
import type { ReactElement } from "react";

import { Button, Text } from "./primitives";

const CHOOSE_APP_ITEMS: { slug: AppSlug; label: string }[] = [
  { slug: "admin-panel", label: "Admin panel" },
  { slug: "kitchen-panel", label: "Kitchen panel" },
  { slug: "waiter-panel", label: "Waiter panel" },
];

export interface ChooseAppProps {
  onSelectApp: (slug: AppSlug) => void;
}

export const ChooseApp = ({ onSelectApp }: ChooseAppProps): ReactElement => {
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
