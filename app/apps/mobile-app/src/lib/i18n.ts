import ar from "../locales/ar.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import pl from "../locales/pl.json";

export const SUPPORTED_LOCALES = ["en", "pl", "es", "ar"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const MOBILE_LOCALE_STORAGE_KEY = "restorio.mobile.locale";

export const messagesByLocale: Record<SupportedLocale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  pl: pl as Record<string, unknown>,
  es: es as Record<string, unknown>,
  ar: ar as Record<string, unknown>,
};

export const readStoredLocale = (): SupportedLocale | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MOBILE_LOCALE_STORAGE_KEY)?.trim().toLowerCase();

    if (raw && SUPPORTED_LOCALES.includes(raw as SupportedLocale)) {
      return raw as SupportedLocale;
    }
  } catch {
    // ignore
  }

  return null;
};

export const persistMobileLocale = (locale: SupportedLocale): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MOBILE_LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
};

export const resolveInitialLocale = (): SupportedLocale => {
  return readStoredLocale() ?? "pl";
};
