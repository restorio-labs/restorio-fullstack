import type { User, AuthTokens, Restaurant, Menu, Order, Table } from "@restorio/types";

import { type ApiClient } from "./client";

const API_V1_PREFIX = "/api/v1";

const withV1 = (path: string): string => `${API_V1_PREFIX}${path}`;

export interface RegisterPayload {
  email: string;
  password: string;
  restaurantName: string;
}

export interface RegisterResponse {
  message: string;
  id: string;
  email: string;
  account_type: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export class RestorioApi {
  constructor(private client: ApiClient) {}

  auth = {
    login: (email: string, password: string): Promise<AuthTokens> =>
      this.client.post(withV1("/auth/login"), { email, password }),

    register: (data: RegisterPayload): Promise<RegisterResponse> => this.client.post(withV1("/auth/register"), data),

    refresh: (refreshToken: string): Promise<AuthTokens> => this.client.post(withV1("/auth/refresh"), { refreshToken }),

    me: (): Promise<User> => this.client.get(withV1("/auth/me")),
  };

  restaurants = {
    list: (): Promise<Restaurant[]> => this.client.get(withV1("/restaurants")),

    get: (id: string): Promise<Restaurant> => this.client.get(withV1(`/restaurants/${id}`)),

    create: (data: Partial<Restaurant>): Promise<Restaurant> => this.client.post(withV1("/restaurants"), data),

    update: (id: string, data: Partial<Restaurant>): Promise<Restaurant> =>
      this.client.put(withV1(`/restaurants/${id}`), data),

    delete: (id: string): Promise<void> => this.client.delete(withV1(`/restaurants/${id}`)),
  };

  menus = {
    list: (restaurantId: string): Promise<Menu[]> => this.client.get(withV1(`/restaurants/${restaurantId}/menus`)),

    get: (restaurantId: string, menuId: string): Promise<Menu> =>
      this.client.get(withV1(`/restaurants/${restaurantId}/menus/${menuId}`)),

    create: (restaurantId: string, data: Partial<Menu>): Promise<Menu> =>
      this.client.post(withV1(`/restaurants/${restaurantId}/menus`), data),

    update: (restaurantId: string, menuId: string, data: Partial<Menu>): Promise<Menu> =>
      this.client.put(withV1(`/restaurants/${restaurantId}/menus/${menuId}`), data),

    delete: (restaurantId: string, menuId: string): Promise<void> =>
      this.client.delete(withV1(`/restaurants/${restaurantId}/menus/${menuId}`)),
  };

  orders = {
    list: (restaurantId: string): Promise<Order[]> => this.client.get(withV1(`/restaurants/${restaurantId}/orders`)),

    get: (restaurantId: string, orderId: string): Promise<Order> =>
      this.client.get(withV1(`/restaurants/${restaurantId}/orders/${orderId}`)),

    create: (restaurantId: string, data: Partial<Order>): Promise<Order> =>
      this.client.post(withV1(`/restaurants/${restaurantId}/orders`), data),

    updateStatus: (restaurantId: string, orderId: string, status: string): Promise<Order> =>
      this.client.patch(withV1(`/restaurants/${restaurantId}/orders/${orderId}/status`), { status }),
  };

  tables = {
    list: (restaurantId: string): Promise<Table[]> => this.client.get(withV1(`/restaurants/${restaurantId}/tables`)),

    create: (restaurantId: string, data: Partial<Table>): Promise<Table> =>
      this.client.post(withV1(`/restaurants/${restaurantId}/tables`), data),

    update: (restaurantId: string, tableId: string, data: Partial<Table>): Promise<Table> =>
      this.client.put(withV1(`/restaurants/${restaurantId}/tables/${tableId}`), data),

    delete: (restaurantId: string, tableId: string): Promise<void> =>
      this.client.delete(withV1(`/restaurants/${restaurantId}/tables/${tableId}`)),
  };
}
