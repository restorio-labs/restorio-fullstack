import type { PluginCreator } from "tailwindcss/types/config";

import { colorTokens } from "../tokens/colors";

const flattenToCSSVars = (
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> => {
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = `--color-${prefix ? `${prefix}-` : ""}${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

    if (typeof value === "string") {
      result[cssKey] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenToCSSVars(value as Record<string, unknown>, prefix ? `${prefix}-${key}` : key, result);
    }
  }

  return result;
};

export const themePlugin: PluginCreator = ({ addBase }) => {
  const lightVars = flattenToCSSVars(colorTokens.light);
  const darkVars = flattenToCSSVars(colorTokens.dark);

  addBase({
    ":root": lightVars,
    '[data-theme="dark"]': darkVars,
    ".dark": darkVars,
  });
};
