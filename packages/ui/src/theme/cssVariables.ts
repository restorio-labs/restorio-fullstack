import type { ThemeOverride } from "../tokens";

const flattenToCSSVariables = (
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> => {
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = prefix
      ? `--${prefix}-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
      : `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

    if (typeof value === "string") {
      result[cssKey] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenToCSSVariables(value as Record<string, unknown>, prefix ? `${prefix}-${key}` : key, result);
    }
  }

  return result;
};

export const generateCSSVariables = (override: ThemeOverride): Record<string, string> => {
  const variables: Record<string, string> = {};

  if (override.colors) {
    Object.assign(variables, flattenToCSSVariables(override.colors, "color"));
  }

  if (override.spacing) {
    Object.assign(variables, flattenToCSSVariables(override.spacing, "spacing"));
  }

  if (override.radius) {
    Object.assign(variables, flattenToCSSVariables(override.radius, "radius"));
  }

  if (override.typography) {
    if (override.typography.fontFamily) {
      Object.assign(variables, flattenToCSSVariables(override.typography.fontFamily, "font-family"));
    }

    if (override.typography.fontSize) {
      Object.assign(variables, flattenToCSSVariables(override.typography.fontSize, "font-size"));
    }

    if (override.typography.fontWeight) {
      Object.assign(variables, flattenToCSSVariables(override.typography.fontWeight, "font-weight"));
    }
  }

  if (override.shadows) {
    Object.assign(variables, flattenToCSSVariables(override.shadows, "shadow"));
  }

  if (override.zIndex) {
    Object.assign(variables, flattenToCSSVariables(override.zIndex, "z-index"));
  }

  return variables;
};
