"use client";

import { ContentContainer, Text } from "@restorio/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export const Footer = (): ReactElement => {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();
  const listLinkClassName = "text-sm text-text-secondary transition-colors hover:text-interactive-primary";
  const footerSections = [
    {
      title: t("sections.product"),
      links: [
        { href: "#", label: t("navigation.features") },
        { href: "#", label: t("navigation.pricing") },
        { href: "#", label: t("navigation.demo") },
      ],
    },
    {
      title: t("sections.company"),
      links: [
        { href: "/about", label: t("navigation.about") },
        { href: "/privacy", label: t("navigation.privacy") },
        { href: "/terms", label: t("navigation.terms") },
      ],
    },
  ];

  return (
    <footer className="border-t border-border-default bg-surface-secondary py-12">
      <ContentContainer maxWidth="2xl" padding>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-1 sm:col-span-2 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-interactive-primary" />
              <Text variant="h4" weight="bold">
                {t("brand")}
              </Text>
            </div>
            <Text variant="body-sm" className="max-w-xs text-text-secondary">
              {t("description")}
            </Text>
          </div>
          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <Text variant="body-sm" weight="semibold" className="mb-4 uppercase tracking-wider text-text-primary">
                {section.title}
              </Text>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={listLinkClassName}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border-default pt-8">
          <Text variant="body-sm" className="text-center text-text-tertiary">
            {t("copyright", { year: currentYear })}
          </Text>
        </div>
      </ContentContainer>
    </footer>
  );
};
