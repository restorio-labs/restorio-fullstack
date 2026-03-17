import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { locales } from "./request";

const DEFAULT_METADATA_BASE = "http://localhost:3000";

const OPEN_GRAPH_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  pl: "pl_PL",
  es: "es_ES",
  ar: "ar_AR",
};

const PAGE_KEYS = ["home", "about", "login", "register", "activate"] as const;

type PageKey = (typeof PAGE_KEYS)[number];

const isPageKey = (value: string): value is PageKey => PAGE_KEYS.includes(value as PageKey);

const resolveLocale = (locale: string): string => {
  if (locales.includes(locale as (typeof locales)[number])) {
    return locale;
  }

  return "en";
};

export const getRootMetadata = async (locale: string): Promise<Metadata> => {
  const safeLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: safeLocale, namespace: "metadata" });
  const siteTitle = t("title");
  const siteDescription = t("description");

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_METADATA_BASE),
    openGraph: {
      type: "website",
      siteName: siteTitle,
      locale: OPEN_GRAPH_LOCALE_MAP[safeLocale] ?? OPEN_GRAPH_LOCALE_MAP.en,
      title: siteTitle,
      description: siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
    },
  };
};

export const getPageMetadata = async (locale: string, pageKey: string): Promise<Metadata> => {
  const safeLocale = resolveLocale(locale);
  const safePageKey: PageKey = isPageKey(pageKey) ? pageKey : "home";
  const t = await getTranslations({ locale: safeLocale, namespace: "metadata" });

  return {
    title: t(`pages.${safePageKey}.title`),
    description: t(`pages.${safePageKey}.description`),
    openGraph: {
      title: t(`pages.${safePageKey}.title`),
      description: t(`pages.${safePageKey}.description`),
    },
    twitter: {
      title: t(`pages.${safePageKey}.title`),
      description: t(`pages.${safePageKey}.description`),
    },
  };
};
