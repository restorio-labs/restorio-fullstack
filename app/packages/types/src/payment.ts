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

export interface PublicOrderItemRequest {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PublicCreateOrderPaymentRequest {
  tenantSlug: string;
  tableNumber: number;
  email: string;
  items: PublicOrderItemRequest[];
  note?: string;
}

export interface PublicCreateOrderPaymentData {
  token: string;
  redirectUrl: string;
}

export interface PublicTenantInfo {
  name: string;
  slug: string;
}
