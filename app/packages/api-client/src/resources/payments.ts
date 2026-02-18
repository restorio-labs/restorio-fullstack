import { BaseResource } from "./base";

export interface UpdateP24ConfigRequest {
  p24_merchantid: number;
  p24_api: string;
  p24_crc: string;
}

export class PaymentsResource extends BaseResource {
  updateP24Config(tenantId: string, data: UpdateP24ConfigRequest, signal?: AbortSignal): Promise<void> {
    return this.client.put(`/payments/tenant/${tenantId}/p24-config`, data, { signal });
  }
}
