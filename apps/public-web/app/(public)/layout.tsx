"use client";

import type { ReactNode } from "react";

import { Footer } from "@/components/app/Footer";
import { Header } from "@/components/app/Header";
import { ContentContainer } from "@restorio/ui";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Header />
      <main id="main-content" className="flex-1">
        <ContentContainer maxWidth="lg" padding>
          {children}
        </ContentContainer>
      </main>
      <Footer />
    </div>
  );
}
