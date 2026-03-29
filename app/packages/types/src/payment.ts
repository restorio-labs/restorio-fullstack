import type { PaginatedResponse } from "./common";
import type { TenantStatus } from "./tenant";

export interface UpdateP24ConfigRequest {
  p24_merchantid: number;
  p24_api: string;
  p24_crc: string;
}

export interface UpdateP24ConfigData {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
}

export interface UpdateP24ConfigResponse {
  message: string;
  data: UpdateP24ConfigData;
}

export interface TransactionListItem {
  session_id: string;
  p24_order_id: number | null;
  amount: number;
  email: string;
  status: number;
  description: string;
  order: Record<string, unknown> | null;
  note: string | null;
  created_at: string;
}

export type TransactionListData = PaginatedResponse<TransactionListItem>;
