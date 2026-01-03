import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

import { colorTokens, type ThemeMode, type ThemeOverride } from "../tokens";

import { generateCSSVariables } from "./cssVariables";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  override: ThemeOverride | null;
  setOverride: (override: ThemeOverride | null) => void;
  colors: typeof colorTokens.light | typeof colorTokens.dark;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  initialOverride?: ThemeOverride;
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    return mediaQuery.matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "system",
  initialOverride = null,
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [override, setOverrideState] = useState<ThemeOverride | null>(initialOverride);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme());

  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") {
      return;
    }

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent): void => {
        setSystemTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);

      return (): void => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    } catch {
      // Ignore errors in SSR or unsupported environments
    }
  }, [mode]);

  const resolvedMode = useMemo(() => {
    if (mode === "system") {
      return systemTheme;
    }

    return mode;
  }, [mode, systemTheme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      const root = document.documentElement;

      root.setAttribute("data-theme", resolvedMode);
      root.classList.toggle("dark", resolvedMode === "dark");

      if (override) {
        const cssVars = generateCSSVariables(override);

        for (const [key, value] of Object.entries(cssVars)) {
          if (typeof value === "string") {
            root.style.setProperty(key, value);
          }
        }
      }
    } catch {
      // Ignore errors in SSR or unsupported environments
    }
  }, [resolvedMode, override]);

  const setMode = (newMode: ThemeMode): void => {
    setModeState(newMode);
  };

  const setOverride = (newOverride: ThemeOverride | null): void => {
    setOverrideState(newOverride);
  };

  const colors = useMemo(() => {
    const baseColors = resolvedMode === "dark" ? colorTokens.dark : colorTokens.light;

    if (!override?.colors) {
      return baseColors;
    }

    const merged = {
      background: { ...baseColors.background },
      surface: { ...baseColors.surface },
      border: { ...baseColors.border },
      text: { ...baseColors.text },
      interactive: { ...baseColors.interactive },
      status: { ...baseColors.status },
    } as typeof baseColors;

    if (override.colors.background) {
      Object.assign(merged.background, override.colors.background);
    }

    if (override.colors.surface) {
      Object.assign(merged.surface, override.colors.surface);
    }

    if (override.colors.border) {
      Object.assign(merged.border, override.colors.border);
    }

    if (override.colors.text) {
      Object.assign(merged.text, override.colors.text);
    }

    if (override.colors.interactive) {
      Object.assign(merged.interactive, override.colors.interactive);
    }

    if (override.colors.status) {
      Object.assign(merged.status, override.colors.status);
    }

    return merged;
  }, [resolvedMode, override]);

  const value: ThemeContextValue = useMemo(
    () => ({
      mode,
      resolvedMode,
      setMode,
      override,
      setOverride,
      colors,
    }),
    [mode, resolvedMode, override, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
