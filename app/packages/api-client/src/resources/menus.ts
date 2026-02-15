import { type Menu } from "@restorio/types";

import { BaseResource } from "./base";

export class MenusResource extends BaseResource {
  /**
   * List menus.
   * @param restaurantId - The ID of the restaurant to list menus for.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the menus are listed.
   */
  list(restaurantId: string, signal?: AbortSignal): Promise<Menu[]> {
    return this.client.get(`/restaurants/${restaurantId}/menus`, { signal });
  }

  /**
   * Get a menu.
   * @param restaurantId - The ID of the restaurant to get the menu for.
   * @param menuId - The ID of the menu to get.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the menu is retrieved.
   */
  get(restaurantId: string, menuId: string, signal?: AbortSignal): Promise<Menu> {
    return this.client.get(`/restaurants/${restaurantId}/menus/${menuId}`, { signal });
  }

  /**
   * Create a menu.
   * @param restaurantId - The ID of the restaurant to create the menu for.
   * @param data - The data to create the menu with.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the menu is created.
   */
  create(restaurantId: string, data: Partial<Menu>, signal?: AbortSignal): Promise<Menu> {
    return this.client.post(`/restaurants/${restaurantId}/menus`, data, { signal });
  }

  /**
   * Update a menu.
   * @param restaurantId - The ID of the restaurant to update the menu for.
   * @param menuId - The ID of the menu to update.
   * @param data - The data to update the menu with.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the menu is updated.
   */
  update(restaurantId: string, menuId: string, data: Partial<Menu>, signal?: AbortSignal): Promise<Menu> {
    return this.client.put(`/restaurants/${restaurantId}/menus/${menuId}`, data, { signal });
  }

  /**
   * Delete a menu.
   * @param restaurantId - The ID of the restaurant to delete the menu for.
   * @param menuId - The ID of the menu to delete.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the menu is deleted.
   */
  delete(restaurantId: string, menuId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/restaurants/${restaurantId}/menus/${menuId}`, { signal });
  }
}
