import type { UpdateP24ConfigData, UpdateP24ConfigRequest, UpdatedResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class PaymentsResource extends BaseResource {
  async updateP24Config(
    tenantId: string,
    data: UpdateP24ConfigRequest,
    signal?: AbortSignal,
  ): Promise<UpdateP24ConfigData> {
    const response = await this.client.put<UpdatedResponse<UpdateP24ConfigData>>(
      `/payments/tenant/${tenantId}/p24-config`,
      data,
      { signal },
    );

    return response.data;
  }
}
