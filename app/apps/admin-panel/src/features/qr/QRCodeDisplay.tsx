import type { ReactElement } from "react";

interface QRCodeDisplayProps {
  title: string;
  qrDataUrl: string | null;
  subtitle?: string;
  onPrint: () => void;
  onGoBack: () => void;
  isPrintDisabled?: boolean;
}

export const QRCodeDisplay = ({
  title,
  qrDataUrl,
  subtitle,
  onPrint,
  onGoBack,
  isPrintDisabled = false,
}: QRCodeDisplayProps): ReactElement => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="print:hidden flex gap-4">
        <button
          type="button"
          onClick={onGoBack}
          className="rounded-md border border-border-default bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          ← Go Back
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={isPrintDisabled}
          className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
        >
          Print QR Code
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold text-text-primary print:text-5xl">{title}</h1>
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for ${title}`}
            className="h-auto w-full max-w-[600px] print:max-w-[800px]"
          />
        ) : (
          <div className="flex h-[600px] w-[600px] items-center justify-center bg-surface-secondary text-sm text-text-tertiary">
            Generating QR code...
          </div>
        )}
        {subtitle && <p className="text-sm text-text-tertiary print:hidden">{subtitle}</p>}
      </div>
    </div>
  );
};
