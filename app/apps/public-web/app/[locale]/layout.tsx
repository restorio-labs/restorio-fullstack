import { getThemeBootScript } from "@restorio/ui/theme-mode";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactElement, ReactNode } from "react";

import { getRootMetadata } from "../../src/i18n/metadata";
import { routing } from "../../src/i18n/routing";
import { AppProviders } from "../../src/wrappers/AppProviders";

import "../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

interface MetadataParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getRootMetadata(locale);
}

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps): Promise<ReactElement> {
  const themeBootScript = getThemeBootScript();
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale });

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Theme boot script must run before hydration - no user input */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-interactive-primary focus:text-text-inverse focus:rounded-button focus-visible-ring focus:block focus:not-sr-only"
        >
          {t("common.skipToContent")}
        </a>
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
