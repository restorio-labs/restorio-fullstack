import type { FloorCanvas } from "@restorio/types";

import { BaseResource } from "./base";

export class FloorCanvasesResource extends BaseResource {
  /**
   * List floor canvases.
   * @param tenantId - The ID of the tenant to list canvases for.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the canvases are listed.
   */
  list(tenantId: string, signal?: AbortSignal): Promise<FloorCanvas[]> {
    return this.client.get(`/tenants/${tenantId}/canvases`, { signal });
  }

  /**
   * Get a floor canvas.
   * @param tenantId - The ID of the tenant to get the canvas for.
   * @param canvasId - The ID of the canvas to get.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the canvas is retrieved.
   */
  get(tenantId: string, canvasId: string, signal?: AbortSignal): Promise<FloorCanvas> {
    return this.client.get(`/tenants/${tenantId}/canvases/${canvasId}`, { signal });
  }

  /**
   * Create a floor canvas.
   * @param tenantId - The ID of the tenant to create the canvas for.
   * @param data - The data to create the canvas with.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the canvas is created.
   */
  create(
    tenantId: string,
    data: Omit<FloorCanvas, "id" | "tenantId" | "version">,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    return this.client.post(`/tenants/${tenantId}/canvases`, data, { signal });
  }

  /**
   * Update a floor canvas.
   * @param tenantId - The ID of the tenant to update the canvas for.
   * @param canvasId - The ID of the canvas to update.
   * @param data - The data to update the canvas with.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the canvas is updated.
   */
  update(
    tenantId: string,
    canvasId: string,
    data: Partial<Pick<FloorCanvas, "name" | "width" | "height" | "elements">>,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    return this.client.put(`/tenants/${tenantId}/canvases/${canvasId}`, data, { signal });
  }

  /**
   * Delete a floor canvas.
   * @param tenantId - The ID of the tenant to delete the canvas for.
   * @param canvasId - The ID of the canvas to delete.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the canvas is deleted.
   */
  delete(tenantId: string, canvasId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/tenants/${tenantId}/canvases/${canvasId}`, { signal });
  }
}
