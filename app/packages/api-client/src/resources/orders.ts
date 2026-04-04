import type { Order, OrderFilters, OrderStatus, RestaurantKitchenConfig, SuccessResponse } from "@restorio/types";

import { BaseResource } from "./base";

interface UpdateStatusPayload {
  status: OrderStatus;
  rejectionReason?: string;
}

export class OrdersResource extends BaseResource {
  list(restaurantId: string, filters?: OrderFilters, signal?: AbortSignal): Promise<SuccessResponse<Order[]>> {
    return this.client.get(`/restaurants/${restaurantId}/orders`, {
      params: filters as Record<string, string | number | Date>,
      signal,
    });
  }

  get(restaurantId: string, orderId: string, signal?: AbortSignal): Promise<SuccessResponse<Order>> {
    return this.client.get(`/restaurants/${restaurantId}/orders/${orderId}`, { signal });
  }

  create(restaurantId: string, data: Partial<Order>, signal?: AbortSignal): Promise<Order> {
    return this.client.post(`/restaurants/${restaurantId}/orders`, data, { signal });
  }

  update(restaurantId: string, orderId: string, data: Partial<Order>, signal?: AbortSignal): Promise<Order> {
    return this.client.put(`/restaurants/${restaurantId}/orders/${orderId}`, data, { signal });
  }

  updateStatus(
    restaurantId: string,
    orderId: string,
    status: OrderStatus,
    rejectionReason?: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<Order>> {
    const payload: UpdateStatusPayload = { status };

    if (rejectionReason) {
      payload.rejectionReason = rejectionReason;
    }

    return this.client.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, payload, { signal });
  }

  archive(
    restaurantId: string,
    orderId: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<{ id: string; originalOrderId: string }>> {
    return this.client.post(`/restaurants/${restaurantId}/orders/${orderId}/archive`, {}, { signal });
  }

  getKitchenConfig(restaurantId: string, signal?: AbortSignal): Promise<SuccessResponse<RestaurantKitchenConfig>> {
    return this.client.get(`/restaurants/${restaurantId}/kitchen-config`, { signal });
  }

  refund(
    restaurantId: string,
    orderId: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<{ orderId: string; status: string }>> {
    return this.client.post(`/restaurants/${restaurantId}/orders/${orderId}/refund`, {}, { signal });
  }
}
