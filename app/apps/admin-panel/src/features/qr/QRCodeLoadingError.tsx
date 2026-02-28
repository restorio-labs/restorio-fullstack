import type { ReactElement } from "react";

interface QRCodeLoadingErrorProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onGoBack: () => void;
}

export const QRCodeLoadingError = ({
  isLoading,
  isError,
  errorMessage = "Failed to load QR code.",
  onGoBack,
}: QRCodeLoadingErrorProps): ReactElement | null => {
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-sm text-text-tertiary">
          <p className="mb-4">{errorMessage}</p>
          <button type="button" onClick={onGoBack} className="text-interactive-primary hover:underline">
            Go back to QR Code Generator
          </button>
        </div>
      </div>
    );
  }

  return null;
};
