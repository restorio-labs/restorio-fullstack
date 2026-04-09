import type { PaginatedResponse } from "./common";
import type { TenantStatus } from "./tenant";

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

export interface PublicOrderItemRequest {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PublicCreateOrderPaymentRequest {
  tenantSlug: string;
  tableNumber: number;
  tableRef?: string;
  lockToken?: string;
  email: string;
  items: PublicOrderItemRequest[];
  note?: string;
}

export interface PublicCreateOrderPaymentData {
  token: string;
  redirectUrl: string;
  lockToken: string;
  expiresAt: string;
  tableStatus: string;
  ownerType: string;
}

export interface PublicTableSessionRequest {
  tenantSlug: string;
  tableNumber: number;
  tableRef?: string;
  lockToken?: string;
}

export interface PublicTableSessionRefreshRequest {
  lockToken: string;
}

export interface PublicTableSessionReleaseRequest {
  lockToken: string;
}

export interface PublicTableSessionData {
  lockToken: string;
  expiresAt: string;
  tableStatus: string;
  ownerType: string;
  tableRef: string;
  tableNumber?: number | null;
  message?: string | null;
}

export interface PublicTenantInfo {
  name: string;
  slug: string;
  pageTitle?: string | null;
  faviconPath?: string | null;
  themeOverride?: Record<string, unknown> | null;
}

export interface PublicP24TransactionSyncData {
  sessionId: string;
  status: number;
  p24OrderId: number | null;
  amount: number;
  currency: string;
  p24Status: number;
  responseCode: number;
  statement?: string | null;
  date?: string | null;
  dateOfTransaction?: string | null;
}
