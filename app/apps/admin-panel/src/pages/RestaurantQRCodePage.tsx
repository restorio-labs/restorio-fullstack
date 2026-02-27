import { getAppHref } from "@restorio/utils";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useQRCodeDataUrl } from "../features/qr/hooks/useQRCodeDataUrl";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { QRCodeDisplay } from "../features/qr/QRCodeDisplay";
import { QRCodeLoadingError } from "../features/qr/QRCodeLoadingError";

export const RestaurantQRCodePage = (): ReactElement => {
  const { tenantsState } = useCurrentTenant();
  const navigate = useNavigate();
  const { tenant, isLoading } = useSelectedTenantDetails();
  const menuUrl = useMemo(() => {
    if (!tenant) {
      return null;
    }

    return `${getAppHref("mobile-app")}/${tenant.slug}`;
  }, [tenant]);
  const qrDataUrl = useQRCodeDataUrl(menuUrl, {
    width: 1024,
    margin: 2,
    errorMessage: "Failed to generate QR code for restaurant:",
  });

  const handlePrint = (): void => {
    window.print();
  };

  const handleGoBack = (): void => {
    navigate("/qr-code-generator");
  };

  const loadingError = QRCodeLoadingError({
    isLoading,
    isError: tenantsState === "error" || !tenant,
    errorMessage: "Failed to load restaurant QR code.",
    onGoBack: handleGoBack,
  });

  if (loadingError) {
    return loadingError;
  }

  return (
    <QRCodeDisplay
      title={tenant!.name}
      qrDataUrl={qrDataUrl}
      subtitle="Restaurant Menu"
      onPrint={handlePrint}
      onGoBack={handleGoBack}
      isPrintDisabled={!qrDataUrl}
    />
  );
};
