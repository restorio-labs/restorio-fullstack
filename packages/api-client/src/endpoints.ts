import { ApiClient } from './client';
import type {
  User,
  AuthTokens,
  Restaurant,
  Menu,
  Order,
  Table,
} from '@restorio/types';

export class RestorioApi {
  constructor(private client: ApiClient) {}

  auth = {
    login: (email: string, password: string): Promise<AuthTokens> =>
      this.client.post('/auth/login', { email, password }),
    
    register: (data: { email: string; password: string; firstName: string; lastName: string }): Promise<AuthTokens> =>
      this.client.post('/auth/register', data),
    
    refresh: (refreshToken: string): Promise<AuthTokens> =>
      this.client.post('/auth/refresh', { refreshToken }),
    
    me: (): Promise<User> =>
      this.client.get('/auth/me'),
  };

  restaurants = {
    list: (): Promise<Restaurant[]> =>
      this.client.get('/restaurants'),
    
    get: (id: string): Promise<Restaurant> =>
      this.client.get(`/restaurants/${id}`),
    
    create: (data: Partial<Restaurant>): Promise<Restaurant> =>
      this.client.post('/restaurants', data),
    
    update: (id: string, data: Partial<Restaurant>): Promise<Restaurant> =>
      this.client.put(`/restaurants/${id}`, data),
    
    delete: (id: string): Promise<void> =>
      this.client.delete(`/restaurants/${id}`),
  };

  menus = {
    list: (restaurantId: string): Promise<Menu[]> =>
      this.client.get(`/restaurants/${restaurantId}/menus`),
    
    get: (restaurantId: string, menuId: string): Promise<Menu> =>
      this.client.get(`/restaurants/${restaurantId}/menus/${menuId}`),
    
    create: (restaurantId: string, data: Partial<Menu>): Promise<Menu> =>
      this.client.post(`/restaurants/${restaurantId}/menus`, data),
    
    update: (restaurantId: string, menuId: string, data: Partial<Menu>): Promise<Menu> =>
      this.client.put(`/restaurants/${restaurantId}/menus/${menuId}`, data),
    
    delete: (restaurantId: string, menuId: string): Promise<void> =>
      this.client.delete(`/restaurants/${restaurantId}/menus/${menuId}`),
  };

  orders = {
    list: (restaurantId: string): Promise<Order[]> =>
      this.client.get(`/restaurants/${restaurantId}/orders`),
    
    get: (restaurantId: string, orderId: string): Promise<Order> =>
      this.client.get(`/restaurants/${restaurantId}/orders/${orderId}`),
    
    create: (restaurantId: string, data: Partial<Order>): Promise<Order> =>
      this.client.post(`/restaurants/${restaurantId}/orders`, data),
    
    updateStatus: (restaurantId: string, orderId: string, status: string): Promise<Order> =>
      this.client.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, { status }),
  };

  tables = {
    list: (restaurantId: string): Promise<Table[]> =>
      this.client.get(`/restaurants/${restaurantId}/tables`),
    
    create: (restaurantId: string, data: Partial<Table>): Promise<Table> =>
      this.client.post(`/restaurants/${restaurantId}/tables`, data),
    
    update: (restaurantId: string, tableId: string, data: Partial<Table>): Promise<Table> =>
      this.client.put(`/restaurants/${restaurantId}/tables/${tableId}`, data),
    
    delete: (restaurantId: string, tableId: string): Promise<void> =>
      this.client.delete(`/restaurants/${restaurantId}/tables/${tableId}`),
  };
}

