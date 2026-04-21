import { Button, EmptyState, Text, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { MobileLanguageSwitcher } from "../components/GuestBottomNav";
import { readLastVisitedTenantPath } from "../lib/lastVisitedTenant";

export const RootRedirectPage = (): ReactElement => {
  const { t } = useI18n();
  const to = readLastVisitedTenantPath();

  if (to) {
    return <Navigate to={to} replace />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 pb-24 pt-8">
      <div className="w-full max-w-md text-center">
        <EmptyState title={t("root.noRestaurantTitle")} description={t("root.noRestaurantDescription")} />
      </div>
      <Text as="p" variant="body-sm" className="max-w-sm text-center text-text-tertiary">
        {t("root.scanHint")}
      </Text>
      <Button variant="secondary" type="button" onClick={() => window.location.reload()}>
        {t("common.tryAgain")}
      </Button>
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-default bg-surface-primary/95 px-4 py-3 backdrop-blur-sm"
        aria-label={t("language.switcherAria")}
      >
        <div className="mx-auto flex max-w-lg justify-center">
          <MobileLanguageSwitcher />
        </div>
      </nav>
    </div>
  );
};
