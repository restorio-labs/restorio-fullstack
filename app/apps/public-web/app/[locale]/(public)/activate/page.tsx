import type { Metadata } from "next";
import type { ReactElement } from "react";

import { getPageMetadata, type MetadataParams } from "@/i18n/metadata";

import { ActivateContent } from "./ActivateContent";

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getPageMetadata(locale, "activate");
}

export default function ActivatePage(): ReactElement {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <ActivateContent />
    </div>
  );
}
