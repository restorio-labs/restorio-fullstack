"use client";

import { ContentContainer, Text } from "@restorio/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement } from "react";

export const Footer = (): ReactElement => {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const listLinkClassName = "text-sm text-text-secondary transition-colors hover:text-interactive-primary";

  return (
    <footer className="border-t border-border-default bg-surface-secondary py-12">
      <ContentContainer maxWidth="2xl" padding>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-interactive-primary" />
              <Text variant="h4" weight="bold">
                {t("footer.brand")}
              </Text>
            </div>
            <Text variant="body-sm" className="max-w-xs text-text-secondary">
              {t("footer.description")}
            </Text>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div>
              <Text variant="body-sm" weight="semibold" className="mb-4 uppercase tracking-wider text-text-primary">
                {t("footer.sections.product")}
              </Text>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className={listLinkClassName}>
                    {t("navigation.features")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className={listLinkClassName}>
                    {t("navigation.pricing")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className={listLinkClassName}>
                    {t("navigation.demo")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <Text variant="body-sm" weight="semibold" className="mb-4 uppercase tracking-wider text-text-primary">
                {t("footer.sections.company")}
              </Text>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className={listLinkClassName}>
                    {t("navigation.about")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className={listLinkClassName}>
                    {t("navigation.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className={listLinkClassName}>
                    {t("navigation.terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border-default pt-8">
          <Text variant="body-sm" className="text-center text-text-tertiary">
            {t("footer.copyright", { year: currentYear })}
          </Text>
        </div>
      </ContentContainer>
    </footer>
  );
};
