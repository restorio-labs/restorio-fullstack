import type { colorTokens } from "./colors";
import type { radiusTokens } from "./radius";
import type { shadowTokens } from "./shadows";
import type { spacingTokens } from "./spacing";
import type { typographyTokens } from "./typography";
import type { zIndexTokens } from "./zIndex";

export type ThemeMode = "light" | "dark" | "system";

export type Direction = "ltr" | "rtl" | "auto";

export interface ThemeOverride {
  colors?: Partial<{
    [K in keyof typeof colorTokens.light]: Partial<(typeof colorTokens.light)[K]>;
  }>;
  spacing?: Partial<typeof spacingTokens>;
  radius?: Partial<typeof radiusTokens>;
  typography?: Partial<{
    fontFamily?: Partial<typeof typographyTokens.fontFamily>;
    fontSize?: Partial<typeof typographyTokens.fontSize>;
    fontWeight?: Partial<typeof typographyTokens.fontWeight>;
  }>;
  shadows?: Partial<typeof shadowTokens>;
  zIndex?: Partial<typeof zIndexTokens>;
}
