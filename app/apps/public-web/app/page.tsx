import { hasLocale } from "next-intl";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { routing } from "../src/i18n/routing";

export default async function RootPage(): Promise<never> {
  const detectedLocale = await getLocale();
  const targetLocale = hasLocale(routing.locales, detectedLocale) ? detectedLocale : routing.defaultLocale;

  redirect(`/${targetLocale}`);
}
