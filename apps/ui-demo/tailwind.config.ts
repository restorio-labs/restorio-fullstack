import type { Config } from "tailwindcss";

import { themePlugin } from "../../packages/ui/src/theme/tailwindPlugin";
import { colorTokens } from "../../packages/ui/src/tokens/colors";
import { radiusTokens, radiusSemantic } from "../../packages/ui/src/tokens/radius";
import { shadowTokens, shadowSemantic } from "../../packages/ui/src/tokens/shadows";
import { spacingScale, spacingTokens } from "../../packages/ui/src/tokens/spacing";
import { typographyTokens } from "../../packages/ui/src/tokens/typography";
import { zIndexTokens } from "../../packages/ui/src/tokens/zIndex";

const flattenColorTokens = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === "string") {
      result[newKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenColorTokens(value as Record<string, unknown>, newKey));
    }
  }

  return result;
};

const lightColors = flattenColorTokens(colorTokens.light);

const typographyTokensFontSize = Object.fromEntries(
  Object.entries(typographyTokens.fontSize).map(([key, value]) => [
    key,
    Array.isArray(value) ? ([value[0], { ...value[1] }] as [string, { lineHeight: string }]) : value,
  ]),
) as Record<string, string | [string, { lineHeight: string }]>;

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ...lightColors,
      },
      spacing: {
        ...spacingTokens,
        ...spacingScale,
      },
      borderRadius: {
        ...radiusTokens,
        ...radiusSemantic,
      },
      fontFamily: typographyTokens.fontFamily,
      fontSize: typographyTokensFontSize,
      fontWeight: typographyTokens.fontWeight,
      letterSpacing: typographyTokens.letterSpacing,
      boxShadow: {
        ...shadowTokens,
        ...shadowSemantic,
      },
      zIndex: Object.fromEntries(Object.entries(zIndexTokens).map(([key, value]) => [key, String(value)])),
    },
  },
  plugins: [themePlugin],
};

export default config;

