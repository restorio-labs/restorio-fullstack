import type { Venue, VenueSummary } from "@restorio/types";

import { BaseResource } from "./base";

export class VenuesResource extends BaseResource {
  /**
   * List venues.
   * @param tenantId - The ID of the tenant to list venues for.
   * @returns A promise that resolves when the venues are listed.
   */
  list(tenantId?: string, signal?: AbortSignal): Promise<VenueSummary[]> {
    return this.client.get("/venues", {
      params: tenantId ? { tenant_id: tenantId } : undefined,
      signal,
    });
  }

  /**
   * Get a venue.
   * @param venueId - The ID of the venue to get.
   * @returns A promise that resolves when the venue is retrieved.
   */
  get(venueId: string, signal?: AbortSignal): Promise<Venue> {
    return this.client.get(`/venues/${venueId}`, { signal });
  }

  /**
   * Create a venue.
   * @param tenantId - The ID of the tenant to create the venue for.
   * @param data - The data to create the venue with.
   * @returns A promise that resolves when the venue is created.
   */
  create(tenantId: string, data: { name: string }, signal?: AbortSignal): Promise<Venue> {
    return this.client.post(`/venues/${tenantId}`, data, { signal });
  }

  /**
   * Update a venue.
   * @param venueId - The ID of the venue to update.
   * @param data - The data to update the venue with.
   * @returns A promise that resolves when the venue is updated.
   */
  update(
    venueId: string,
    data: Partial<Pick<Venue, "name" | "activeLayoutVersionId">>,
    signal?: AbortSignal,
  ): Promise<Venue> {
    return this.client.put(`/venues/${venueId}`, data, { signal });
  }

  /**
   * Delete a venue.
   * @param venueId - The ID of the venue to delete.
   * @returns A promise that resolves when the venue is deleted.
   */
  delete(venueId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/venues/${venueId}`, { signal });
  }
}
