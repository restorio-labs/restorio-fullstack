import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface UseQRCodeDataUrlOptions {
  width?: number;
  margin?: number;
  errorMessage?: string;
}

export const useQRCodeDataUrl = (url: string | null, options?: UseQRCodeDataUrlOptions): string | null => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const width = options?.width ?? 640;
  const margin = options?.margin ?? 2;

  useEffect(() => {
    if (!url) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;

    setQrDataUrl(null);

    void QRCode.toDataURL(url, { width, margin })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch((error) => {
        if (options?.errorMessage) {
          console.error(options.errorMessage, error);
        }

        if (!cancelled) {
          setQrDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [margin, options?.errorMessage, url, width]);

  return qrDataUrl;
};
