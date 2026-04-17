import { Button, EmptyState, Text, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { readLastVisitedTenantPath } from "../lib/lastVisitedTenant";

export const RootRedirectPage = (): ReactElement => {
  const { t } = useI18n();
  const to = readLastVisitedTenantPath();

  if (to) {
    return <Navigate to={to} replace />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-8">
      <EmptyState title={t("root.noRestaurantTitle")} description={t("root.noRestaurantDescription")} />
      <Text as="p" variant="body-sm" className="max-w-sm text-center text-text-tertiary">
        {t("root.scanHint")}
      </Text>
      <Button variant="secondary" type="button" onClick={() => window.location.reload()}>
        {t("common.tryAgain")}
      </Button>
    </div>
  );
};
