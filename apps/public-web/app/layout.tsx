import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "../src/wrappers/AppProviders";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Restorio Platform",
    template: "%s | Restorio Platform",
  },
  description: "Restaurant Management Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Restorio Platform",
  },
  twitter: {
    card: "summary_large_image",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-interactive-primary focus:text-text-inverse focus:rounded-button focus-visible-ring focus:block focus:not-sr-only"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
