import type { FloorCanvas } from "@restorio/types";

import { BaseResource } from "./base";

export class FloorCanvasesResource extends BaseResource {
  /**
   * List all floor canvases for a venue.
   * @param venueId - The ID of the venue to list the canvases for.
   * @param signal - An optional abort signal to cancel the request.
   * @returns A list of floor canvases for the venue.
   */
  list(venueId: string, signal?: AbortSignal): Promise<FloorCanvas[]> {
    return this.client.get(`/venues/${venueId}/canvases`, { signal });
  }

  /**
   * Get a specific floor canvas by its ID.
   * @param venueId - The ID of the venue the canvas belongs to.
   * @param canvasId - The ID of the canvas to get.
   * @returns The floor canvas.
   */
  get(venueId: string, canvasId: string, signal?: AbortSignal): Promise<FloorCanvas> {
    return this.client.get(`/venues/${venueId}/canvases/${canvasId}`, { signal });
  }

  /**
   * Create a new floor canvas.
   * @param venueId - The ID of the venue to create the canvas for.
   * @param data - The data for the new canvas.
   * @returns The created floor canvas.
   */
  create(
    venueId: string,
    data: Omit<FloorCanvas, "id" | "venueId" | "version">,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    return this.client.post(`/venues/${venueId}/canvases`, data, { signal });
  }

  /**
   * Update a specific floor canvas.
   * @param venueId - The ID of the venue the canvas belongs to.
   * @param canvasId - The ID of the canvas to update.
   * @param data - The data to update the canvas with.
   * @returns The updated floor canvas.
   */
  update(
    venueId: string,
    canvasId: string,
    data: Partial<Pick<FloorCanvas, "name" | "width" | "height" | "elements">>,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    return this.client.put(`/venues/${venueId}/canvases/${canvasId}`, data, { signal });
  }

  /**
   * Delete a specific floor canvas.
   * @param venueId - The ID of the venue the canvas belongs to.
   * @param canvasId - The ID of the canvas to delete.
   * @returns A promise that resolves when the canvas is deleted.
   */
  delete(venueId: string, canvasId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/venues/${venueId}/canvases/${canvasId}`, { signal });
  }
}
