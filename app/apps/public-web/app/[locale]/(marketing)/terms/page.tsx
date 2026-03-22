import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { TableOfContents } from "@/components/legal/TableOfContents";

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: t("termsAndConditions.title"),
    description: t("termsAndConditions.description"),
  };
}

const TermsPage = async ({ params }: PageParams): Promise<ReactElement> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  const lastUpdatedDate = "18 marca 2026";

  const termsSections = [
    "generalProvisions",
    "definitions",
    "registration",
    "subscriptionAndPayments",
    "userRights",
    "operatorRights",
    "dataProtection",
    "intellectualProperty",
    "termination",
    "liability",
    "complaints",
    "finalProvisions",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("termsAndConditions.title"),
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: t("termsAndConditions.description"),
    },
  };

  return (
    <LegalPageLayout>
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t("termsAndConditions.title")}</h1>
          <p className="text-sm text-text-secondary">
            {t("termsAndConditions.lastUpdated", { date: lastUpdatedDate })}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <TableOfContents sections={termsSections} namespace="termsAndConditions" />

            {termsSections.map((sectionId) => (
              <LegalSection
                key={`termsAndConditions:${sectionId}`}
                id={sectionId}
                namespace={`termsAndConditions.sections.${sectionId}`}
              />
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 text-sm text-text-secondary">
              <p>
                <strong>{t("common.lastUpdated")}:</strong> {lastUpdatedDate}
              </p>
            </div>
          </aside>
        </div>
      </article>
    </LegalPageLayout>
  );
};

export default TermsPage;
