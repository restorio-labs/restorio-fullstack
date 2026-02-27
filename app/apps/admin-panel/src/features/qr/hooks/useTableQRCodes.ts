import type { Tenant } from "@restorio/types";
import { toDataURL } from "qrcode";
import { useEffect, useState } from "react";

import { getTableQrUrl } from "../tableQRCodes";

export interface TableQRCode {
  tableId: number;
  url: string;
  qrDataUrl: string | null;
}

interface UseTableQRCodesOptions {
  width?: number;
  margin?: number;
  errorMessage?: string;
}

interface UseTableQRCodesResult {
  tableQRCodes: TableQRCode[];
  isGenerating: boolean;
}

export const useTableQRCodes = (
  tenant: Tenant | null,
  tables: number[],
  options?: UseTableQRCodesOptions,
): UseTableQRCodesResult => {
  const [tableQRCodes, setTableQRCodes] = useState<TableQRCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const width = options?.width ?? 512;
  const margin = options?.margin ?? 2;

  useEffect(() => {
    if (!tenant || tables.length === 0) {
      setTableQRCodes([]);
      setIsGenerating(false);

      return;
    }

    const abortController = new AbortController();
    const isCancelled = (): boolean => abortController.signal.aborted;

    setTableQRCodes([]);
    setIsGenerating(true);

    const generateQRCodes = async (): Promise<void> => {
      for (const tableId of tables) {
        if (isCancelled()) {
          break;
        }

        const url = getTableQrUrl(tenant.slug, tableId);

        try {
          const qrDataUrl = await toDataURL(url, { width, margin });

          if (!isCancelled()) {
            setTableQRCodes((prev) => [...prev, { tableId, url, qrDataUrl }]);
          }
        } catch (error) {
          if (options?.errorMessage) {
            console.error(options.errorMessage, error);
          } else {
            console.error(`Failed to generate QR code for table ${tableId}:`, error);
          }

          if (!isCancelled()) {
            setTableQRCodes((prev) => [...prev, { tableId, url, qrDataUrl: null }]);
          }
        }
      }

      if (!isCancelled()) {
        setIsGenerating(false);
      }
    };

    void generateQRCodes();

    return () => {
      abortController.abort();
    };
  }, [margin, options?.errorMessage, tables, tenant, width]);

  return { tableQRCodes, isGenerating };
};
