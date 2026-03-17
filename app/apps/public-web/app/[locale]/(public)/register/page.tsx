import type { Metadata } from "next";
import type { ReactElement } from "react";

import { RegisterContent } from "./RegisterContent";

import { getPageMetadata } from "@/i18n/metadata";

interface MetadataParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getPageMetadata(locale, "register");
}

export default function RegisterPage(): ReactElement {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-sm">
        <RegisterContent />
      </div>
    </div>
  );
}
