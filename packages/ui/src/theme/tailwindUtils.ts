import type { Config } from "tailwindcss";

import { colorTokens } from "../tokens/colors";
import { radiusTokens, radiusSemantic } from "../tokens/radius";
import { shadowTokens, shadowSemantic } from "../tokens/shadows";
import { spacingScale, spacingTokens } from "../tokens/spacing";
import { typographyTokens } from "../tokens/typography";
import { zIndexTokens } from "../tokens/zIndex";

import { themePlugin } from "./tailwindPlugin";

export const flattenColorTokens = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
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

export const getFlattenedLightColors = (): Record<string, string> => {
  return flattenColorTokens(colorTokens.light);
};

export const getTypographyFontSize = (): Record<string, string | [string, { lineHeight: string }]> => {
  return Object.fromEntries(
    Object.entries(typographyTokens.fontSize).map(([key, value]) => [
      key,
      Array.isArray(value) ? ([value[0], { ...value[1] }] as [string, { lineHeight: string }]) : value,
    ]),
  ) as Record<string, string | [string, { lineHeight: string }]>;
};

export const getZIndexConfig = (): Record<string, string> => {
  return Object.fromEntries(Object.entries(zIndexTokens).map(([key, value]) => [key, String(value)]));
};

export interface CreateTailwindConfigOptions {
  content: string[];
  uiPackagePath?: string;
}

export const createTailwindThemeConfig = (): Config["theme"] => {
  const lightColors = getFlattenedLightColors();
  const typographyFontSize = getTypographyFontSize();
  const zIndex = getZIndexConfig();

  return {
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
      fontSize: typographyFontSize,
      fontWeight: typographyTokens.fontWeight,
      letterSpacing: typographyTokens.letterSpacing,
      boxShadow: {
        ...shadowTokens,
        ...shadowSemantic,
      },
      zIndex,
    },
  };
};

export const createTailwindConfig = (options: CreateTailwindConfigOptions): Config => {
  const { content, uiPackagePath } = options;

  const finalContent = uiPackagePath ? [...content, `${uiPackagePath}/src/**/*.{ts,tsx}`] : content;

  return {
    content: finalContent,
    darkMode: ["class", '[data-theme="dark"]'],
    theme: createTailwindThemeConfig(),
    plugins: [themePlugin],
  };
};
