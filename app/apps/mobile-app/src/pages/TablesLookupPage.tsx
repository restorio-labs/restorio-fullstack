import type { PublicFloorCanvasOverview, PublicTenantInfo, PublicTablesOverview } from "@restorio/types";
import { Button, cn, EmptyState, Loader, Text, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { useApplyPublicTenantPresentation } from "../hooks/useApplyPublicTenantPresentation";
import { persistLastVisitedTenantPath } from "../lib/lastVisitedTenant";

const REFRESH_MS = 12_000;

interface FloorPreviewProps {
  canvas: PublicFloorCanvasOverview;
  openLabel: string;
  closedLabel: string;
}

const FloorPreview = ({ canvas, openLabel, closedLabel }: FloorPreviewProps): ReactElement => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;

    if (!el) {
      return;
    }

    const measure = (): void => {
      const w = el.clientWidth;

      if (w <= 0 || canvas.width <= 0) {
        return;
      }

      setScale(Math.min(1, w / canvas.width));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return (): void => {
      ro.disconnect();
    };
  }, [canvas.width]);

  return (
    <div ref={wrapRef} className="w-full max-w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border border-border-default bg-surface-secondary shadow-inner"
        style={{
          width: canvas.width * scale,
          height: canvas.height * scale,
        }}
      >
        {canvas.tables.map((tbl) => {
          const isOpen = tbl.status === "open";

          return (
            <div
              key={tbl.id}
              className={cn(
                "absolute flex items-center justify-center rounded-md border-2 px-0.5 text-center text-[10px] font-bold leading-tight text-text-primary sm:text-xs",
                isOpen
                  ? "border-status-success-border bg-status-success-background/90"
                  : "border-status-error-border bg-status-error-background/90",
              )}
              style={{
                left: tbl.x * scale,
                top: tbl.y * scale,
                width: Math.max(10, tbl.w * scale),
                height: Math.max(10, tbl.h * scale),
                transform: tbl.rotation ? `rotate(${tbl.rotation}deg)` : undefined,
                transformOrigin: "center",
              }}
              title={isOpen ? openLabel : closedLabel}
            >
              <span className="line-clamp-2">
                {tbl.label?.trim() || (tbl.tableNumber != null ? String(tbl.tableNumber) : "—")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TablesLookupPage = (): ReactElement => {
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

  const tablesQuery = useQuery<PublicTablesOverview>({
    queryKey: ["public-tables-overview", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantTablesOverview(tenantSlug!, signal),
    enabled: !!tenantSlug,
    refetchInterval: REFRESH_MS,
  });

  useApplyPublicTenantPresentation(tenantQuery.data);

  if (!tenantSlug) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <EmptyState title={t("order.invalidLinkTitle")} description={t("order.invalidLinkDescription")} />
      </div>
    );
  }

  const isLoading = tenantQuery.isLoading || tablesQuery.isLoading;
  const isError = tenantQuery.isError || tablesQuery.isError;

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size="lg" />
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {t("tables.loading")}
          </Text>
        </div>
      </div>
    );
  }

  if (isError || !tenantQuery.data || !tablesQuery.data) {
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

  const displayName = tenantQuery.data.pageTitle?.trim()
    ? tenantQuery.data.pageTitle
    : tenantQuery.data.name;
  const lc = tenantQuery.data.landingContent;
  const openLabel = lc?.openStatusLabel?.trim() || t("tables.statusOpen");
  const closedLabel = lc?.closedStatusLabel?.trim() || t("tables.statusClosed");

  const canvases = tablesQuery.data.canvases.filter((c) => c.tables.length > 0);
  const flatTables = canvases.flatMap((c) => c.tables);

  return (
    <div className="min-h-[100dvh] bg-background-primary pb-24">
      <header className="sticky top-0 z-10 border-b border-border-default bg-surface-primary px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}`)}>
            {t("tables.back")}
          </Button>
        </div>
        <Text as="h1" variant="h4" weight="bold" className="mt-1 text-center">
          {displayName}
        </Text>
        <Text as="p" variant="body-sm" className="text-center text-text-secondary">
          {t("tables.subtitle")}
        </Text>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-4 flex flex-wrap justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success-border bg-status-success-background/50 px-3 py-1 font-medium">
            <span className="h-2 w-2 rounded-full bg-status-success-text" aria-hidden />
            {openLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-error-border bg-status-error-background/50 px-3 py-1 font-medium">
            <span className="h-2 w-2 rounded-full bg-status-error-text" aria-hidden />
            {closedLabel}
          </span>
        </div>

        {canvases.length === 0 ? (
          <EmptyState title={t("tables.noLayoutTitle")} description={t("tables.noLayoutDescription")} />
        ) : (
          <div className="flex flex-col gap-8">
            {canvases.map((canvas) => (
              <section key={`${canvas.name}-${canvas.width}`}>
                <Text as="h2" variant="body-md" weight="semibold" className="mb-2 px-1">
                  {canvas.name}
                </Text>
                <FloorPreview canvas={canvas} openLabel={openLabel} closedLabel={closedLabel} />
              </section>
            ))}
          </div>
        )}

        {flatTables.length > 0 ? (
          <div className="mt-8 rounded-xl border border-border-default bg-surface-primary p-4">
            <Text as="h2" variant="body-md" weight="semibold" className="mb-3">
              {t("tables.listTitle")}
            </Text>
            <ul className="flex flex-col gap-2">
              {flatTables.map((tbl, index) => {
                const isOpen = tbl.status === "open";
                const label = tbl.label?.trim() || t("order.tableLabel", { number: String(tbl.tableNumber ?? "?") });

                return (
                  <li
                    key={`${tbl.id}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border-default px-3 py-2.5"
                  >
                    <Text as="span" variant="body-sm" weight="medium" className="min-w-0 truncate">
                      {label}
                    </Text>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        isOpen ? "bg-status-success-background text-status-success-text" : "bg-status-error-background text-status-error-text",
                      )}
                    >
                      {isOpen ? openLabel : closedLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border-default bg-surface-primary/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg justify-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}`)}>
            {t("landing.navHome")}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}/menu`)}>
            {t("landing.navMenu")}
          </Button>
        </div>
      </nav>
    </div>
  );
};
