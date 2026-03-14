import { Text } from "@restorio/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export const ActivateLoadingView = (): ReactElement => {
  const t = useTranslations("activate");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("loading.title")}
      </Text>
      <Text variant="body-lg" className="mb-6 text-text-secondary">
        {t("loading.subtitle")}
      </Text>
      <div className="flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-transparent" />
      </div>
    </>
  );
};
