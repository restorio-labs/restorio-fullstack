import type {
  CreatedResponse,
  PublicCreateOrderPaymentData,
  PublicCreateOrderPaymentRequest,
  PublicP24TransactionSyncData,
  PublicTenantInfo,
  SuccessResponse,
  TenantMenu,
} from "@restorio/types";

import { BaseResource } from "./base";

export class PublicResource extends BaseResource {
  async getTenantInfo(tenantSlug: string, signal?: AbortSignal): Promise<PublicTenantInfo> {
    const body = await this.client.get<SuccessResponse<PublicTenantInfo>>(`/public/${tenantSlug}/info`, { signal });

    return body.data;
  }

  async getTenantMenu(tenantSlug: string, signal?: AbortSignal): Promise<TenantMenu> {
    const body = await this.client.get<SuccessResponse<TenantMenu>>(`/public/${tenantSlug}/menu`, { signal });

    return body.data;
  }

  async createOrderPayment(
    data: PublicCreateOrderPaymentRequest,
    signal?: AbortSignal,
  ): Promise<PublicCreateOrderPaymentData> {
    const body = await this.client.post<CreatedResponse<PublicCreateOrderPaymentData>, PublicCreateOrderPaymentRequest>(
      "/public/payments/create",
      data,
      { signal },
    );

    return body.data;
  }

  async syncPaymentSession(sessionId: string, signal?: AbortSignal): Promise<PublicP24TransactionSyncData> {
    const body = await this.client.post<SuccessResponse<PublicP24TransactionSyncData>>(
      `/public/payments/sessions/${encodeURIComponent(sessionId)}/p24-sync`,
      {},
      { signal },
    );

    return body.data;
  }
}
