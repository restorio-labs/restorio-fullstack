import type { Metadata } from "next";
import type { ReactElement } from "react";

import { HomeContent } from "./HomeContent";

import { getPageMetadata } from "@/i18n/metadata";

interface MetadataParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getPageMetadata(locale, "home");
}

export default function HomePage(): ReactElement {
  return <HomeContent />;
}
