import type { Metadata } from "next";

import { HomeContent } from "./HomeContent";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Restorio Platform",
};

export default function HomePage(): JSX.Element {
  return <HomeContent />;
}
