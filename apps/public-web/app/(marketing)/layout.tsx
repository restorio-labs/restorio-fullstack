"use client";

import type { ReactNode } from "react";

import { Footer } from "@components/app/Footer";
import { Header } from "@components/app/Header";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps): JSX.Element {
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
