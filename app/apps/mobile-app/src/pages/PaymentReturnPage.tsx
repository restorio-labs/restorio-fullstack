import type { PublicP24TransactionSyncData } from "@restorio/types";
import { Button, Loader, Text } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useSearchParams } from "react-router-dom";

import { publicApi } from "../api/client";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

const extractApiErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const r = error as { response?: { data?: { detail?: unknown } } };
    const d = r.response?.data?.detail;

    if (typeof d === "string") {
      return d;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nie udało się sprawdzić statusu płatności.";
};

const paymentStatusPresentation = (
  status: number,
): { title: string; description: string; tone: "success" | "warning" | "error" } => {
  switch (status) {
    case 2:
      return {
        title: "Dziękujemy!",
        description: "Płatność została zaksięgowana. Twoje zamówienie jest przyjęte.",
        tone: "success",
      };
    case 1:
      return {
        title: "Zamówienie dotarło do kuchni. Oczekuje na przyjęcie.",
        description: "Zamówienie oczekuje na zaakceptowanie przez kuchnię.",
        tone: "warning",
      };
    case 3:
      return {
        title: "Zwrot płatności",
        description: "Ta transakcja została zwrócona.",
        tone: "error",
      };
    default:
      return {
        title: "Płatność nieukończona",
        description:
          "Nie udało się potwierdzić płatności. Jeśli środki zostały pobrane, skontaktuj się z obsługą Przelewy24.",
        tone: "warning",
      };
  }
};

export const PaymentReturnPage = (): ReactElement => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId")?.trim() ?? "";
  const sessionIdValid = sessionId.length > 0 && UUID_RE.test(sessionId);

  const { data, isError, error, refetch, isFetching, isPending } = useQuery<PublicP24TransactionSyncData, Error>({
    queryKey: ["public-p24-sync", sessionId],
    queryFn: ({ signal }) => publicApi.syncPaymentSession(sessionId, signal),
    enabled: sessionIdValid,
    retry: 2,
  });

  const presentation = data ? paymentStatusPresentation(data.status) : null;

  const iconCircleClass =
    presentation?.tone === "success"
      ? "bg-status-success-bg"
      : presentation?.tone === "error"
        ? "bg-status-error-bg"
        : "bg-status-warning-bg";

  const iconStrokeClass =
    presentation?.tone === "success"
      ? "text-status-success-text"
      : presentation?.tone === "error"
        ? "text-status-error-text"
        : "text-status-warning-text";

  if (!sessionIdValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
        <div className="max-w-sm text-center">
          <Text as="h1" variant="h3" weight="bold" className="mb-2">
            Brak danych płatności
          </Text>
          <Text as="p" variant="body-md" className="text-text-secondary">
            Nie można ustalić sesji płatności. Wróć do menu z kodu QR i spróbuj ponownie.
          </Text>
        </div>
      </div>
    );
  }

  if (isPending || (isFetching && !data)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background-primary p-6">
        <Loader size="lg" />
        <Text as="p" variant="body-md" className="text-text-secondary">
          Sprawdzanie statusu płatności…
        </Text>
      </div>
    );
  }

  if (isError || !presentation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
        <div className="max-w-sm text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconCircleClass}`}>
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <Text as="h1" variant="h3" weight="bold" className="mb-2">
            Błąd sprawdzania
          </Text>
          <Text as="p" variant="body-md" className="text-text-secondary mb-6">
            {extractApiErrorMessage(error)}
          </Text>
          <Button variant="primary" onClick={() => void refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
      <div className="max-w-sm text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconCircleClass}`}>
          {presentation.tone === "success" ? (
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : presentation.tone === "error" ? (
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
        <Text as="h1" variant="h3" weight="bold" className="mb-2">
          {presentation.title}
        </Text>
        <Text as="p" variant="body-md" className="text-text-secondary mb-6">
          {presentation.description}
        </Text>
        {data.status !== 2 ? (
          <>
            <Button variant="primary" fullWidth disabled={isFetching} className="mb-4" onClick={() => void refetch()}>
              {isFetching ? "Sprawdzanie…" : "Sprawdź status ponownie"}
            </Button>
            <Text as="p" variant="body-sm" className="text-text-tertiary">
              Status może się zmienić po chwili — możesz odświeżyć albo zamknąć stronę i wrócić później.
            </Text>
          </>
        ) : (
          <Text as="p" variant="body-sm" className="text-text-tertiary">
            Możesz zamknąć tę stronę.
          </Text>
        )}
      </div>
    </div>
  );
};
