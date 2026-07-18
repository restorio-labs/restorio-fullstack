import type { Metadata } from "next";
import type { ReactElement } from "react";

import { getPageMetadata, type MetadataParams } from "@/i18n/metadata";

import { AboutContent } from "./AboutContent";

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getPageMetadata(locale, "about");
}

export default function AboutPage(): ReactElement {
  return <AboutContent />;
}
