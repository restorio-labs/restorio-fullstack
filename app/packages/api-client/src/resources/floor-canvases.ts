import type { CreatedResponse, FloorCanvas, SuccessResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class FloorCanvasesResource extends BaseResource {
  list(tenantId: string, signal?: AbortSignal): Promise<FloorCanvas[]> {
    return this.client
      .get<SuccessResponse<FloorCanvas[]>>(`/tenants/${tenantId}/canvases`, { signal })
      .then((res) => res.data);
  }

  get(tenantId: string, canvasId: string, signal?: AbortSignal): Promise<FloorCanvas> {
    return this.client
      .get<SuccessResponse<FloorCanvas>>(`/tenants/${tenantId}/canvases/${canvasId}`, { signal })
      .then((res) => res.data);
  }

  create(
    tenantId: string,
    data: Omit<FloorCanvas, "id" | "tenantId" | "version">,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    return this.client
      .post<CreatedResponse<FloorCanvas>>(`/tenants/${tenantId}/canvases`, data, { signal })
      .then((res) => res.data);
  }

  update(
    tenantId: string,
    canvasId: string,
    data: Partial<Pick<FloorCanvas, "name" | "width" | "height" | "elements">>,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    return this.client
      .put<SuccessResponse<FloorCanvas>>(`/tenants/${tenantId}/canvases/${canvasId}`, data, { signal })
      .then((res) => res.data);
  }

  delete(tenantId: string, canvasId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/tenants/${tenantId}/canvases/${canvasId}`, { signal });
  }
}
