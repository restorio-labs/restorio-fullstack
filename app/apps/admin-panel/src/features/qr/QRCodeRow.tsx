import type { ReactElement } from "react";
import { Link } from "react-router-dom";

interface QRCodeRowProps {
  tableId?: number;
  qrDataUrl: string | null;
}

export const QRCodeRow = ({ tableId, qrDataUrl }: QRCodeRowProps): ReactElement => {
  return (
    <Link
      to={tableId !== undefined ? `/qr-code/table/${tableId}` : "/qr-code/restaurant"}
      className="flex items-center justify-between gap-4 rounded-lg border border-border-default bg-surface-primary p-4 transition-colors hover:bg-surface-secondary print:break-inside-avoid print:border-2 print:border-black"
    >
      <h3 className="text-lg font-semibold text-text-primary print:text-2xl">
        {tableId !== undefined ? `Table ${tableId}` : "Restaurant"}
      </h3>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={tableId !== undefined ? `QR code for table ${tableId}` : "QR code for restaurant"}
          className="h-auto w-full max-w-[160px] print:max-w-[180px]"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center bg-surface-secondary text-sm text-text-tertiary">
          Failed to generate QR code
        </div>
      )}
    </Link>
  );
};
