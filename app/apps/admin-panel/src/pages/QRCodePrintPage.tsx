import { getAppHref } from "@restorio/utils";
import QRCode from "qrcode";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useTenants } from "../hooks/useTenants";
import { PageLayout } from "../layouts/PageLayout";

export const QRCodePrintPage = (): ReactElement => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { tenants, state } = useTenants();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === tenantId) ?? null, [tenantId, tenants]);

  const menuUrl = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return `${getAppHref("mobile-app")}/${selectedTenant.slug}`;
  }, [selectedTenant]);

  useEffect(() => {
    if (!menuUrl) {
      setQrDataUrl(null);

      return;
    }

    let cancelled = false;

    void QRCode.toDataURL(menuUrl, { width: 640, margin: 2 }).then((dataUrl) => {
      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  const handlePrint = (): void => {
    window.print();
  };

  if (state === "idle" || state === "loading") {
    return (
      <PageLayout title="Printable QR Code" description="Print QR code for a restaurant menu">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-sm text-text-tertiary">Loading restaurant...</div>
        </div>
      </PageLayout>
    );
  }

  if (state === "error") {
    return (
      <PageLayout title="Printable QR Code" description="Print QR code for a restaurant menu">
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          Failed to load restaurant. Please try again later.
        </div>
      </PageLayout>
    );
  }

  if (!selectedTenant || !menuUrl) {
    return (
      <PageLayout title="Printable QR Code" description="Print QR code for a restaurant menu">
        <div className="p-6 text-sm text-text-tertiary">
          Restaurant not found.{" "}
          <Link to="/qr-code-generator" className="text-interactive-primary hover:underline">
            Back to QR Code Generator
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${selectedTenant.name} QR Code`} description="Print QR code for your restaurant menu">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 p-6 text-center">
        <div className="print:hidden">
          <Link to="/qr-code-generator" className="text-sm text-interactive-primary hover:underline">
            Back to restaurant list
          </Link>
        </div>

        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for ${selectedTenant.name} menu`}
            width={640}
            height={640}
            className="w-full max-w-[640px] rounded-lg border border-border-default bg-surface-primary p-3"
          />
        ) : (
          <div className="text-sm text-text-tertiary">Generating QR code...</div>
        )}

        <button
          type="button"
          onClick={handlePrint}
          className="print:hidden rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Print
        </button>
      </div>
    </PageLayout>
  );
};
