import type { SaveTenantMenuPayload, SuccessResponse, TenantMenu, UpdatedResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class MenusResource extends BaseResource {
  async get(tenantId: string, signal?: AbortSignal): Promise<TenantMenu | null> {
    const response = await this.client.get<SuccessResponse<TenantMenu | null>>(`/tenants/${tenantId}/menu`, { signal });

    return response.data;
  }

  async save(tenantId: string, data: SaveTenantMenuPayload, signal?: AbortSignal): Promise<TenantMenu> {
    const response = await this.client.put<UpdatedResponse<TenantMenu>>(`/tenants/${tenantId}/menu`, data, { signal });

    return response.data;
  }
}
