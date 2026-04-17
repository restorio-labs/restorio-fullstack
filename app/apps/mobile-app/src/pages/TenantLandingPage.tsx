import type { PublicTenantInfo } from "@restorio/types";
import { Button, EmptyState, Loader, Text, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { useApplyPublicTenantPresentation } from "../hooks/useApplyPublicTenantPresentation";
import { persistLastVisitedTenantPath } from "../lib/lastVisitedTenant";

export const TenantLandingPage = (): ReactElement => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  useEffect(() => {
    if (tenantSlug) {
      persistLastVisitedTenantPath(`/${tenantSlug}`);
    }
  }, [tenantSlug]);

  const tenantQuery = useQuery<PublicTenantInfo>({
    queryKey: ["public-tenant-info", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantInfo(tenantSlug!, signal),
    enabled: !!tenantSlug,
  });

  useApplyPublicTenantPresentation(tenantQuery.data);

  if (!tenantSlug) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <EmptyState title={t("order.invalidLinkTitle")} description={t("order.invalidLinkDescription")} />
      </div>
    );
  }

  if (tenantQuery.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <EmptyState
          title={t("order.loadErrorTitle")}
          description={t("order.loadErrorDescription")}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t("order.reload")}
            </Button>
          }
        />
      </div>
    );
  }

  const data = tenantQuery.data;
  const lc = data.landingContent;
  const displayName = data.pageTitle?.trim() ? data.pageTitle : data.name;
  const headline = lc?.headline?.trim() ? lc.headline : displayName;
  const subtitle = lc?.subtitle?.trim() ? lc.subtitle : t("landing.defaultSubtitle");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background-primary px-4 pb-28 pt-8">
      <header className="mx-auto w-full max-w-md text-center">
        <Text as="h1" variant="h3" weight="bold" className="text-balance">
          {headline}
        </Text>
        <Text as="p" variant="body-md" className="mt-3 text-pretty text-text-secondary">
          {subtitle}
        </Text>
      </header>

      <div className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3">
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/${tenantSlug}/tables`)}>
          {lc?.tablesCtaLabel?.trim() || t("landing.ctaTables")}
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(`/${tenantSlug}/menu`)}>
          {lc?.menuCtaLabel?.trim() || t("landing.ctaMenu")}
        </Button>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-border-default bg-surface-primary/95 px-4 py-3 backdrop-blur-sm"
        aria-label={t("landing.quickNavAria")}
      >
        <div className="mx-auto flex max-w-md justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/${tenantSlug}/tables`)}>
            {t("landing.navTables")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/${tenantSlug}/menu`)}>
            {t("landing.navMenu")}
          </Button>
        </div>
      </nav>
    </div>
  );
};
