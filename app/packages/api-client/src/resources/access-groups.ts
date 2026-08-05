import type { AccessGroup, AccessGroupInput, AccessGroupOptions, SuccessResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class AccessGroupsResource extends BaseResource {
  async list(tenantId: string, signal?: AbortSignal): Promise<AccessGroup[]> {
    const { data } = await this.client.get<SuccessResponse<AccessGroup[]>>(
      `/tenants/${encodeURIComponent(tenantId)}/access-groups`,
      { signal },
    );

    return data;
  }

  async options(tenantId: string, signal?: AbortSignal): Promise<AccessGroupOptions> {
    const { data } = await this.client.get<SuccessResponse<AccessGroupOptions>>(
      `/tenants/${encodeURIComponent(tenantId)}/access-groups/options`,
      { signal },
    );

    return data;
  }

  async create(tenantId: string, body: AccessGroupInput, signal?: AbortSignal): Promise<AccessGroup> {
    const { data } = await this.client.post<SuccessResponse<AccessGroup>>(
      `/tenants/${encodeURIComponent(tenantId)}/access-groups`,
      body,
      { signal },
    );

    return data;
  }

  async update(tenantId: string, groupId: string, body: AccessGroupInput, signal?: AbortSignal): Promise<AccessGroup> {
    const { data } = await this.client.put<SuccessResponse<AccessGroup>>(
      `/tenants/${encodeURIComponent(tenantId)}/access-groups/${encodeURIComponent(groupId)}`,
      body,
      { signal },
    );

    return data;
  }

  async delete(tenantId: string, groupId: string, signal?: AbortSignal): Promise<void> {
    await this.client.delete(`/tenants/${encodeURIComponent(tenantId)}/access-groups/${encodeURIComponent(groupId)}`, {
      signal,
    });
  }

  async assign(tenantId: string, groupId: string, accountId: string, signal?: AbortSignal): Promise<void> {
    await this.client.put(
      `/tenants/${encodeURIComponent(tenantId)}/access-groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(accountId)}`,
      undefined,
      { signal },
    );
  }

  async unassign(tenantId: string, groupId: string, accountId: string, signal?: AbortSignal): Promise<void> {
    await this.client.delete(
      `/tenants/${encodeURIComponent(tenantId)}/access-groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(accountId)}`,
      { signal },
    );
  }
}
