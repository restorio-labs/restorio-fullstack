import type { ReactElement } from "react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useQRCodeDataUrl } from "../features/qr/hooks/useQRCodeDataUrl";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { QRCodeDisplay } from "../features/qr/QRCodeDisplay";
import { QRCodeLoadingError } from "../features/qr/QRCodeLoadingError";
import { getTableQrUrl } from "../features/qr/tableQRCodes";

export const TableQRCodePage = (): ReactElement => {
  const { tableId } = useParams<{ tableId: string }>();
  const { tenantsState } = useCurrentTenant();
  const navigate = useNavigate();

  const tableNumber = tableId ? parseInt(tableId, 10) : null;

  const { tenant, isLoading } = useSelectedTenantDetails();
  const qrUrl = useMemo(() => {
    if (!tenant || !tableNumber) {
      return null;
    }

    return getTableQrUrl(tenant.slug, tableNumber);
  }, [tableNumber, tenant]);
  const qrDataUrl = useQRCodeDataUrl(qrUrl, {
    width: 1024,
    margin: 2,
    errorMessage: tableNumber ? `Failed to generate QR code for table ${tableNumber}:` : undefined,
  });

  const handlePrint = (): void => {
    window.print();
  };

  const handleGoBack = (): void => {
    navigate("/qr-code-generator");
  };

  const loadingError = QRCodeLoadingError({
    isLoading,
    isError: tenantsState === "error" || !tenant || !tableNumber,
    errorMessage: "Failed to load table QR code.",
    onGoBack: handleGoBack,
  });

  if (loadingError) {
    return loadingError;
  }

  return (
    <QRCodeDisplay
      title={`Table ${tableNumber}`}
      qrDataUrl={qrDataUrl}
      subtitle={tenant!.name}
      onPrint={handlePrint}
      onGoBack={handleGoBack}
      isPrintDisabled={!qrDataUrl}
    />
  );
};
