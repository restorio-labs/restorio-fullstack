import type { ApiClient } from "./client";
import {
  RestaurantsResource,
  TablesResource,
  TenantsResource,
  FloorCanvasesResource,
  MenusResource,
  OrdersResource,
  AuthResource,
  PaymentsResource,
} from "./resources";

/**
 * Main API client for Restorio backend.
 * Provides typed methods for all API endpoints.
 */
export class RestorioApi {
  public readonly auth: AuthResource;
  public readonly payments: PaymentsResource;
  public readonly restaurants: RestaurantsResource;
  public readonly menus: MenusResource;
  public readonly orders: OrdersResource;
  public readonly tables: TablesResource;
  public readonly tenants: TenantsResource;
  public readonly floorCanvases: FloorCanvasesResource;

  constructor(private client: ApiClient) {
    this.auth = new AuthResource(this.client);
    this.payments = new PaymentsResource(this.client);
    this.restaurants = new RestaurantsResource(this.client);
    this.floorCanvases = new FloorCanvasesResource(this.client);
    this.menus = new MenusResource(this.client);
    this.orders = new OrdersResource(this.client);
    this.tables = new TablesResource(this.client);
    this.tenants = new TenantsResource(this.client);
  }
}
