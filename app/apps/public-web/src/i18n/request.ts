import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "pl", "es", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const messagesModule = (await import(`../locales/${locale}.json`)) as Record<string, unknown>;

  return {
    locale,
    messages: JSON.parse(JSON.stringify(messagesModule)),
  };
});
