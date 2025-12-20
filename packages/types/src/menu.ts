export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  categories: MenuCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  allergens: string[];
  nutritionalInfo?: NutritionalInfo;
  modifiers: MenuModifier[];
  sortOrder: number;
}

export interface MenuModifier {
  id: string;
  name: string;
  options: ModifierOption[];
  required: boolean;
  multiSelect: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

