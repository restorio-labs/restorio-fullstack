import type { Order, OrderFilters, OrderStatus } from "@restorio/types";

import { BaseResource } from "./base";

export class OrdersResource extends BaseResource {
  /**
   * List orders.
   * @param restaurantId - The ID of the restaurant to list orders for.
   * @param filters - The filters to apply to the orders.
   * @returns A promise that resolves when the orders are listed.
   */
  list(restaurantId: string, filters?: OrderFilters, signal?: AbortSignal): Promise<Order[]> {
    return this.client.get(`/restaurants/${restaurantId}/orders`, {
      params: filters as Record<string, string | number | Date>,
      signal,
    });
  }

  /**
   * Get an order.
   * @param restaurantId - The ID of the restaurant to get the order for.
   * @param orderId - The ID of the order to get.
   * @returns A promise that resolves when the order is retrieved.
   */
  get(restaurantId: string, orderId: string, signal?: AbortSignal): Promise<Order> {
    return this.client.get(`/restaurants/${restaurantId}/orders/${orderId}`, { signal });
  }

  /**
   * Create an order.
   * @param restaurantId - The ID of the restaurant to create the order for.
   * @param data - The data to create the order with.
   * @returns A promise that resolves when the order is created.
   */
  create(restaurantId: string, data: Partial<Order>, signal?: AbortSignal): Promise<Order> {
    return this.client.post(`/restaurants/${restaurantId}/orders`, data, { signal });
  }

  /**
   * Update the status of an order.
   * @param restaurantId - The ID of the restaurant to update the order for.
   * @param orderId - The ID of the order to update.
   * @param status - The new status of the order.
   * @returns A promise that resolves when the order status is updated.
   */
  updateStatus(restaurantId: string, orderId: string, status: OrderStatus, signal?: AbortSignal): Promise<Order> {
    return this.client.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, { status }, { signal });
  }
}
