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
