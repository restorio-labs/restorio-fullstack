import type { PluginCreator } from "tailwindcss/types/config";

import { colorTokens } from "../tokens/colors";

import { flattenColorTokensToCSSVariables } from "./cssVariables";

export const themePlugin: PluginCreator = ({ addBase }) => {
  const lightVars = flattenColorTokensToCSSVariables(colorTokens.light as unknown as Record<string, unknown>);
  const darkVars = flattenColorTokensToCSSVariables(colorTokens.dark as unknown as Record<string, unknown>);

  addBase({
    ":root": lightVars,
    '[data-theme="dark"]': darkVars,
    ".dark": darkVars,
  });
};
