import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // locales: ["en", "pl", "es", "ar"],
  locales: ["pl"],
  defaultLocale: "pl",
  // Always prefix locales so / redirects to a specific locale (e.g., /pl)
  localePrefix: "always",
  // localeDetection: true,
  localeDetection: false,
});
