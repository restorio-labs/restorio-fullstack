import type { TransactionListData, TransactionListItem } from "@restorio/types";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../../api/client";
import { useCurrentTenant } from "../../../context/TenantContext";

interface UseTransactionsResult {
  selectedTenantId: string | null;
  transactions: TransactionListItem[];
  isLoading: boolean;
  isError: boolean;
}

export const useTransactions = (): UseTransactionsResult => {
  const { selectedTenantId } = useCurrentTenant();
  const { data, isPending, isError } = useQuery<TransactionListData>({
    queryKey: ["transactions", selectedTenantId ?? ""],
    queryFn: ({ signal }) => api.payments.listTransactions(selectedTenantId!, signal),
    enabled: selectedTenantId !== null,
  });

  return {
    selectedTenantId,
    transactions: data?.items ?? [],
    isLoading: isPending,
    isError,
  };
};
