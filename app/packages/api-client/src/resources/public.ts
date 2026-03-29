import type {
  CreatedResponse,
  PublicCreateOrderPaymentData,
  PublicCreateOrderPaymentRequest,
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
      `/public/payments/create`,
      data,
      { signal },
    );

    return body.data;
  }
}
