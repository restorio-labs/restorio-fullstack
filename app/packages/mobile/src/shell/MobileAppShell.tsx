import { buildScopedThemeStyle, cn, resolveGoogleFontStylesheetHref, useGoogleFontStylesheet } from "@restorio/ui";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useMemo } from "react";

import type { MobileRuntimeScreen, MobileRuntimeThemeViewModel } from "../view-models";

export interface MobileAppShellProps {
  screen: MobileRuntimeScreen;
  theme: MobileRuntimeThemeViewModel;
  children: ReactNode;
  navigation?: ReactNode;
  className?: string;
  contained?: boolean;
}

export const MobileAppShell = ({
  screen,
  theme,
  children,
  navigation,
  className,
  contained = false,
}: MobileAppShellProps): ReactElement => {
  const scopedStyle = useMemo(
    () => buildScopedThemeStyle(theme.appearance, theme.override ?? null) as CSSProperties,
    [theme.appearance, theme.override],
  );
  const customFontHref = theme.googleFontStylesheetHref?.trim();
  const fontHref = customFontHref ? customFontHref : resolveGoogleFontStylesheetHref(theme.override ?? null);

  useGoogleFontStylesheet(fontHref);

  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background-primary font-sans text-text-primary",
        contained && "min-h-[640px] overflow-y-auto",
        navigation && screen !== "order" ? "pb-24" : "pb-8",
        className,
      )}
      data-mobile-screen={screen}
      data-theme={theme.appearance}
      style={scopedStyle}
    >
      {children}
      {navigation}
    </div>
  );
};
