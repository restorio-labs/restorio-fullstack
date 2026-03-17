import type { TransactionListData, TransactionListItem } from "@restorio/types";
import { useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

type TransactionStatusCode = 0 | 1 | 2 | 3;

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount / 100);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const getField = (value: Record<string, unknown>, key: string): unknown => value[key];

const toTransactionItem = (value: unknown): TransactionListItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sessionRaw = getField(value, "session_id");
  const amountRaw = getField(value, "amount");
  const emailRaw = getField(value, "email");
  const statusRaw = getField(value, "status");
  const descriptionRaw = getField(value, "description");
  const createdAtRaw = getField(value, "created_at");
  const p24OrderIdRaw = getField(value, "p24_order_id");
  const noteRaw = getField(value, "note");
  const orderRaw = getField(value, "order");

  const sessionId = typeof sessionRaw === "string" ? sessionRaw : null;
  const amount = typeof amountRaw === "number" ? amountRaw : null;
  const email = typeof emailRaw === "string" ? emailRaw : null;
  const status = typeof statusRaw === "number" ? statusRaw : null;
  const description = typeof descriptionRaw === "string" ? descriptionRaw : null;
  const createdAt = typeof createdAtRaw === "string" ? createdAtRaw : null;
  const p24OrderId = typeof p24OrderIdRaw === "number" || p24OrderIdRaw === null ? p24OrderIdRaw : null;
  const note = typeof noteRaw === "string" || noteRaw === null ? noteRaw : null;
  const order = isRecord(orderRaw) || orderRaw === null ? orderRaw : null;

  if (
    sessionId === null ||
    amount === null ||
    email === null ||
    status === null ||
    description === null ||
    createdAt === null
  ) {
    return null;
  }

  return {
    session_id: sessionId,
    p24_order_id: p24OrderId,
    amount,
    email,
    status,
    description,
    order,
    note,
    created_at: createdAt,
  };
};

const toTransactionListData = (value: unknown): TransactionListData => {
  if (!isRecord(value)) {
    return { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
  }

  const itemsRaw = getField(value, "items");
  const totalRaw = getField(value, "total");
  const pageRaw = getField(value, "page");
  const pageSizeRaw = getField(value, "page_size");
  const totalPagesRaw = getField(value, "total_pages");
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map(toTransactionItem).filter((item): item is TransactionListItem => item !== null)
    : [];

  return {
    items,
    total: typeof totalRaw === "number" ? totalRaw : items.length,
    page: typeof pageRaw === "number" ? pageRaw : 1,
    page_size: typeof pageSizeRaw === "number" ? pageSizeRaw : 20,
    total_pages: typeof totalPagesRaw === "number" ? totalPagesRaw : 0,
  };
};

const toTransactionStatusCode = (value: number): TransactionStatusCode | null => {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }

  return null;
};

export const TransactionListPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId } = useCurrentTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);

  useEffect(() => {
    if (selectedTenantId === null) {
      setTransactions([]);
      setIsLoading(false);
      setIsError(false);

      return;
    }

    setTransactions([]);
    setIsLoading(true);
    setIsError(false);

    const controller = new AbortController();

    void (async (): Promise<void> => {
      try {
        const raw = await (
          api as unknown as {
            payments: {
              listTransactions: (tenantId: string, signal?: AbortSignal) => Promise<unknown>;
            };
          }
        ).payments.listTransactions(selectedTenantId, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        const parsed = toTransactionListData(raw);

        setTransactions(parsed.items);
      } catch {
        if (!controller.signal.aborted) {
          setIsError(true);
          setTransactions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedTenantId]);

  return (
    <PageLayout title={t("transactions.title")} description={t("transactions.description")}>
      <div className="w-full p-6">
        <div className="rounded-lg border border-border-default">
          <div className="border-b border-border-default px-4 py-3 text-sm font-medium text-text-secondary">
            {t("transactions.list.title")}
          </div>
          <div className="px-4 py-3">
            {isLoading && <p className="text-sm text-text-tertiary">{t("transactions.list.loading")}</p>}
            {!isLoading && selectedTenantId === null && (
              <p className="text-sm text-text-tertiary">{t("transactions.list.selectTenant")}</p>
            )}
            {!isLoading && isError && <p className="text-sm text-status-error-text">{t("transactions.list.error")}</p>}
            {!isLoading && !isError && selectedTenantId !== null && transactions.length === 0 && (
              <p className="text-sm text-text-tertiary">{t("transactions.list.empty")}</p>
            )}
            {!isLoading && !isError && transactions.length > 0 && (
              <ul className="m-0 list-none divide-y divide-border-default p-0">
                {transactions.map((transaction) => {
                  const statusCode = toTransactionStatusCode(transaction.status);
                  const statusLabel =
                    statusCode === null
                      ? `${t("transactions.status.unknown")} (${transaction.status})`
                      : t(`transactions.status.${statusCode}`);

                  return (
                    <li key={transaction.session_id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {formatAmount(transaction.amount)}
                        </span>
                        <span className="text-xs text-text-secondary">{formatDateTime(transaction.created_at)}</span>
                      </div>
                      <div className="mt-1 text-sm text-text-secondary">{transaction.email}</div>
                      <div className="mt-1 text-xs text-text-tertiary">{transaction.description}</div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-tertiary">
                        <span>
                          {t("transactions.fields.status")}: {statusLabel}
                        </span>
                        <span>
                          {t("transactions.fields.orderId")}: {transaction.p24_order_id ?? "-"}
                        </span>
                        {transaction.note ? (
                          <span>
                            {t("transactions.fields.note")}: {transaction.note}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
