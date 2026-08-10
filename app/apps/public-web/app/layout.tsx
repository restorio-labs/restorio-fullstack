import { getThemeBootScript } from "@restorio/ui/theme-mode";
import type { ReactElement, ReactNode } from "react";

import { defaultLocale } from "../src/i18n/request";

import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  const themeBootScript = getThemeBootScript();

  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        {/* Theme boot script must run before hydration - no user input */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
