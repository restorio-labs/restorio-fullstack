import type {
  CreateTenantProfileRequest,
  CreatedResponse,
  SuccessResponse,
  TenantProfile,
  UpdatedResponse,
} from "@restorio/types";

import { BaseResource } from "./base";

export class TenantProfilesResource extends BaseResource {
  async get(tenantId: string, signal?: AbortSignal): Promise<TenantProfile> {
    const { data } = await this.client.get<SuccessResponse<TenantProfile>>(
      `/tenants/${tenantId}/profile`,
      { signal },
    );

    return data;
  }

  async save(
    tenantId: string,
    body: CreateTenantProfileRequest,
    signal?: AbortSignal,
  ): Promise<TenantProfile> {
    const { data } = await this.client.put<
      SuccessResponse<TenantProfile> | CreatedResponse<TenantProfile>
    >(`/tenants/${tenantId}/profile`, body, { signal });

    return data;
  }
}
