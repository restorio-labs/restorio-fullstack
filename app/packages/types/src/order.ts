export enum OrderStatus {
  NEW = "new",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  PAID = "paid",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId?: string;
  sessionId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  table: string;
  time: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedModifiers: SelectedModifier[];
  totalPrice: number;
  notes?: string;
}

export interface SelectedModifier {
  modifierId: string;
  optionId: string;
  name: string;
  priceAdjustment: number;
}

export interface KitchenOrder {
  id: string;
  status: OrderStatus;
  table: string;
  time: string;
  items: readonly string[];
  notes?: string;
}

export type KitchenStatusIconKey = "add" | "clock" | "check";

export interface KitchenStatusConfig {
  label: string;
  ariaLabel: string;
  indicatorClassName: string;
  iconClassName: string;
  iconKey: KitchenStatusIconKey;
}
