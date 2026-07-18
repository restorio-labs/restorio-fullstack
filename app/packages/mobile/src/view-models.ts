import type { ThemeOverride } from "@restorio/ui";

export type MobileRuntimeAppearance = "light" | "dark";

export type MobileRuntimeScreen = "landing" | "tables" | "menu" | "order";

export interface MobileNavigationItemViewModel {
  id: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

export interface MobileNavigationViewModel {
  ariaLabel: string;
  items: MobileNavigationItemViewModel[];
}

export interface MobileRuntimeThemeViewModel {
  appearance: MobileRuntimeAppearance;
  override?: ThemeOverride | null;
  googleFontStylesheetHref?: string;
}

export interface MobileLandingViewModel {
  headline: string;
  subtitle: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
}

export type MobileTableStatus = "open" | "closed";

export interface MobileTableViewModel {
  id: string;
  label: string;
  status: MobileTableStatus;
  position?: {
    x: number;
    y: number;
  };
}

export interface MobileTablesViewModel {
  title: string;
  subtitle: string;
  backLabel: string;
  floorTitle: string;
  listTitle: string;
  openStatusLabel: string;
  closedStatusLabel: string;
  emptyLabel: string;
  tables: MobileTableViewModel[];
}

export interface MobileMenuItemViewModel {
  id: string;
  name: string;
  description?: string;
  priceLabel: string;
  imageUrl?: string;
  promoted?: boolean;
  promotedLabel?: string;
  quantity?: number;
}

export interface MobileMenuCategoryViewModel {
  id: string;
  name: string;
  items: MobileMenuItemViewModel[];
}

export interface MobileMenuViewModel {
  title: string;
  subtitle: string;
  backLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  categories: MobileMenuCategoryViewModel[];
}

export interface MobileOrderSummaryLineViewModel {
  id: string;
  label: string;
  value: string;
  emphasized?: boolean;
}

export interface MobileOrderViewModel {
  title: string;
  tableCaption: string;
  cartButtonLabel: string;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  categories: MobileMenuCategoryViewModel[];
  summaryTitle: string;
  summaryLines: MobileOrderSummaryLineViewModel[];
}

export type MobileScreenViewModel =
  | { screen: "landing"; content: MobileLandingViewModel }
  | { screen: "tables"; content: MobileTablesViewModel }
  | { screen: "menu"; content: MobileMenuViewModel }
  | { screen: "order"; content: MobileOrderViewModel };

export interface MobileRuntimeViewModel {
  screen: MobileScreenViewModel;
  navigation?: MobileNavigationViewModel;
  theme: MobileRuntimeThemeViewModel;
}

export interface MobileRuntimeActions {
  onNavigate?: (itemId: string) => void;
  onPrimaryLandingAction?: () => void;
  onSecondaryLandingAction?: () => void;
  onBack?: () => void;
  onSelectTable?: (tableId: string) => void;
  onOpenMenuItem?: (itemId: string) => void;
  onAddMenuItem?: (itemId: string) => void;
  onRemoveMenuItem?: (itemId: string) => void;
  onOpenCart?: () => void;
  onSubmitOrder?: () => void;
}
