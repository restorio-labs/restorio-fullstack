import type { TenantSummary } from "@restorio/types";
import { getAppHref } from "@restorio/utils";
import QRCode from "qrcode";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { RestaurantListCard } from "../components/RestaurantListCard";
import { useTenants } from "../hooks/useTenants";
import { PageLayout } from "../layouts/PageLayout";

const getMobileMenuUrl = (tenant: TenantSummary): string => {
  const base = getAppHref("mobile-app");

  return `${base}/${tenant.slug}`;
};

export const QRCodeGeneratorPage = (): ReactElement => {
  const { tenants, state } = useTenants();
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (tenants.length === 0) {
      setQrDataUrls({});

      return;
    }

    let cancelled = false;

    void Promise.allSettled(
      tenants.map(async (tenant) => {
        const dataUrl = await QRCode.toDataURL(getMobileMenuUrl(tenant), { width: 112, margin: 1 });

        return { tenantId: tenant.id, dataUrl };
      }),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      const nextDataUrls: Record<string, string> = {};

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          nextDataUrls[result.value.tenantId] = result.value.dataUrl;
        }
      });

      setQrDataUrls(nextDataUrls);
    });

    return () => {
      cancelled = true;
    };
  }, [tenants]);

  const handleSelectTenant = useCallback(
    (id: string) => {
      navigate(`/qr-code-generator/${id}`);
    },
    [navigate],
  );

  if (state === "idle" || state === "loading") {
    return (
      <PageLayout title="QR Code Generator" description="Generate QR codes that redirect customers to your menu">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading restaurants...</div>
        </div>
      </PageLayout>
    );
  }

  if (state === "error") {
    return (
      <PageLayout title="QR Code Generator" description="Generate QR codes that redirect customers to your menu">
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load restaurants. Please try again later.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="QR Code Generator" description="Generate QR codes that redirect customers to your menu">
      <div className="p-6">
        {tenants.length === 0 ? (
          <div className="text-center text-sm text-text-tertiary py-8">No restaurants found.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {tenants.map((tenant) => (
              <RestaurantListCard
                key={tenant.id}
                title={tenant.name}
                rightContent={
                  qrDataUrls[tenant.id] ? (
                    <div className="shrink-0">
                      <img
                        src={qrDataUrls[tenant.id]}
                        alt={`QR code for ${tenant.name} menu`}
                        width={96}
                        height={96}
                        className="rounded-md border border-border-default bg-surface-primary"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-text-tertiary">Generating QR...</div>
                  )
                }
                onClick={() => handleSelectTenant(tenant.id)}
                ariaLabel={`Open printable QR code for ${tenant.name}`}
              />
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
};
