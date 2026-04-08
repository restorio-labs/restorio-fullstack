import ar from "../locales/ar.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import pl from "../locales/pl.json";

export const SUPPORTED_LOCALES = ["en", "pl", "es", "ar"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const messagesByLocale: Record<SupportedLocale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  pl: pl as Record<string, unknown>,
  es: es as Record<string, unknown>,
  ar: ar as Record<string, unknown>,
};

export const resolveInitialLocale = (): SupportedLocale => {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const raw = navigator.language.split("-")[0].toLowerCase();

  if (SUPPORTED_LOCALES.includes(raw as SupportedLocale)) {
    return raw as SupportedLocale;
  }

  return "en";
};
