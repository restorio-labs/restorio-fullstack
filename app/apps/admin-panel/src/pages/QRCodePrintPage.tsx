import type { ReactElement } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { useTableQRCodes } from "../features/qr/hooks/useTableQRCodes";
import { getTenantTablesFromActiveCanvas } from "../features/qr/tableQRCodes";

export const QRCodePrintPage = (): ReactElement => {
  const { tenantsState } = useCurrentTenant();
  const { tenant, isLoading } = useSelectedTenantDetails();

  const tables = useMemo(() => {
    if (!tenant) {
      return [];
    }

    return getTenantTablesFromActiveCanvas(tenant);
  }, [tenant]);

  const { tableQRCodes, isGenerating } = useTableQRCodes(tenant, tables, {
    width: 512,
    margin: 2,
  });

  const handlePrint = (): void => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-sm text-text-tertiary">Loading restaurant...</div>
      </div>
    );
  }

  if (tenantsState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-text-tertiary">
        Failed to load restaurant. Please try again later.
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-sm text-text-tertiary">
        No restaurant selected.{" "}
        <Link to="/qr-code-generator" className="text-interactive-primary hover:underline">
          Back to QR Code Generator
        </Link>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-text-tertiary">
        <p className="mb-2">No tables found in the floor layout.</p>
        <Link to="/floor-editor" className="text-interactive-primary hover:underline">
          Go to Floor Editor to add tables
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/qr-code-generator"
          className="rounded-md border border-border-default bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Go Back
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          disabled={isGenerating}
          className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
        >
          {isGenerating ? "Generating QR codes..." : "Print"}
        </button>
      </div>

      {isGenerating && (
        <div className="print:hidden text-center text-sm text-text-tertiary">
          Generating QR codes for {tables.length} tables...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
        {tableQRCodes.map((qrCode) => (
          <div key={qrCode.tableId} className="flex flex-col items-center p-2 print:break-inside-avoid">
            {qrCode.qrDataUrl ? (
              <img
                src={qrCode.qrDataUrl}
                alt={`QR code for table ${qrCode.tableId}`}
                className="h-auto w-full max-w-[360px]"
              />
            ) : (
              <div className="flex h-[360px] w-full max-w-[360px] items-center justify-center text-sm text-text-tertiary">
                Failed to generate QR code
              </div>
            )}
            <h3 className="mt-4 text-lg font-semibold text-text-primary print:text-2xl">Table {qrCode.tableId}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};
