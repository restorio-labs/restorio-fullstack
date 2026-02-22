import type { Tenant, TenantSummary } from "@restorio/types";

import { BaseResource } from "./base";

export class TenantsResource extends BaseResource {
  async list(signal?: AbortSignal): Promise<TenantSummary[]> {
    const response = await this.client.get<{ message: string; data: TenantSummary[] }>("/tenants", {
      signal,
    });

    return response.data;
  }

  async get(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
    return this.client.get(`/tenants/${tenantId}`, { signal });
  }

  create(data: { name: string; slug: string; status?: string }, signal?: AbortSignal): Promise<Tenant> {
    return this.client.post("/tenants", data, { signal });
  }

  update(
    tenantId: string,
    data: Partial<Pick<Tenant, "name" | "slug" | "status" | "activeLayoutVersionId">>,
    signal?: AbortSignal,
  ): Promise<Tenant> {
    return this.client.put(`/tenants/${tenantId}`, data, { signal });
  }

  delete(tenantId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/tenants/${tenantId}`, { signal });
  }
}
