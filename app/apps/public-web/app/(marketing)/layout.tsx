"use client";

import { Footer } from "@components/app/Footer";
import { Header } from "@components/app/Header";
import type { ReactElement, ReactNode } from "react";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps): ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
