export const statusConfig = {
  new: {
    label: "New",
    ariaLabel: "New orders",
    indicatorClassName: "bg-status-info-background border-status-info-border text-status-info-text",
    iconClassName: "text-status-info-text",
    iconKey: "add",
  },
  preparing: {
    label: "Preparing",
    ariaLabel: "Preparing orders",
    indicatorClassName: "bg-status-warning-background border-status-warning-border text-status-warning-text",
    iconClassName: "text-status-warning-text",
    iconKey: "clock",
  },
  ready: {
    label: "Ready",
    ariaLabel: "Ready for pickup",
    indicatorClassName: "bg-status-success-background border-status-success-border text-status-success-text",
    iconClassName: "text-status-success-text",
    iconKey: "check",
  },
} as const;

export const orders: readonly {
  id: string;
  status: "new" | "preparing" | "ready";
  table: string;
  time: string;
  items: readonly string[];
  notes?: string;
}[] = [
  {
    id: "K-104",
    status: "new",
    table: "Table 7",
    time: "12:04",
    items: ["Margherita Pizza", "Caesar Salad", "Iced Tea"],
    notes: "No onions on the salad.",
  },
  {
    id: "K-108",
    status: "new",
    table: "Table 3",
    time: "12:07",
    items: ["Veggie Burger", "Fries"],
    notes: "Extra crispy fries.",
  },
  {
    id: "K-101",
    status: "preparing",
    table: "Table 12",
    time: "11:55",
    items: ["Ramen Bowl", "Sparkling Water"],
    notes: "Broth on the side.",
  },
  {
    id: "K-099",
    status: "preparing",
    table: "Takeaway",
    time: "11:50",
    items: ["Chicken Wrap", "Chips"],
  },
  {
    id: "K-093",
    status: "ready",
    table: "Table 2",
    time: "11:42",
    items: ["Pasta Alfredo", "Garlic Bread"],
  },
];
