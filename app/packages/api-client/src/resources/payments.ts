import type { UpdateP24ConfigRequest, UpdateP24ConfigResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class PaymentsResource extends BaseResource {
  updateP24Config(
    tenantId: string,
    data: UpdateP24ConfigRequest,
    signal?: AbortSignal,
  ): Promise<UpdateP24ConfigResponse> {
    return this.client.put(`/payments/tenant/${tenantId}/p24-config`, data, { signal });
  }
}
