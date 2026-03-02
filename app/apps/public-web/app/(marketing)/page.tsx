import type { Metadata } from "next";
import type { ReactElement } from "react";

import { HomeContent } from "./HomeContent";
import { MarketingAuthProvider } from "./MarketingAuthProvider";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Restorio Platform",
};

export default function HomePage(): ReactElement {
  return (
    <MarketingAuthProvider>
      <HomeContent />
    </MarketingAuthProvider>
  );
}
