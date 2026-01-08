import { useState, type ReactElement } from "react";

import { Button, Stack, Text, Toast, ToastContainer } from "@restorio/ui";
import type { ToastVariant } from "@restorio/ui";

interface DemoToast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

const variants: ToastVariant[] = ["info", "success", "warning", "error"];

const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ToastPage = (): ReactElement => {
  const [toasts, setToasts] = useState<DemoToast[]>([]);

  const addToast = (variant: ToastVariant): void => {
    const id = createId();
    const title = `${variant.charAt(0).toUpperCase() + variant.slice(1)} toast`;
    const description = variant === "success" ? "Changes saved successfully." : "Detailed message for this toast.";

    setToasts((current) => [...current, { id, variant, title, description }]);
  };

  const removeToast = (id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Toast
        </Text>
        <Text className="text-text-secondary">Inline notifications with variant-based styling and dismiss controls.</Text>
      </Stack>
      <Stack direction="row" spacing="sm" wrap>
        {variants.map((variant) => (
          <Button key={variant} variant="secondary" onClick={(): void => addToast(variant)}>
            Show {variant}
          </Button>
        ))}
      </Stack>
      <ToastContainer position="top-right">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            action={
              <Button variant="secondary" size="sm" onClick={(): void => removeToast(toast.id)}>
                Dismiss
              </Button>
            }
            onClose={(): void => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </Stack>
  );
};

export default ToastPage;

