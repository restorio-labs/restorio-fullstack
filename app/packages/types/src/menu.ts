export interface TenantMenuItem {
  name: string;
  price: number;
  promoted: 0 | 1;
  desc: string;
  tags: string[];
  isAvailable: boolean;
}

export interface TenantMenuCategory {
  name: string;
  order: number;
  items: TenantMenuItem[];
}

export interface TenantMenu {
  menu: Record<string, Record<string, unknown>>;
  categories: TenantMenuCategory[];
  updatedAt?: string;
}

export interface SaveTenantMenuPayload {
  categories: TenantMenuCategory[];
}
