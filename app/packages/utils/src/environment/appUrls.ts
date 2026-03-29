import { Environment, type AppSlug, type EnvironmentType } from "@restorio/types";

import { LAST_VISITED_APP_STORAGE_KEY } from "../storageKeys";

import { getEnvSource } from "./getEnvSource";
import { resolveNextEnvVar } from "./resolveNextEnvVar";

const LOCAL_PORTS: Record<AppSlug, number> = {
  "public-web": 3000,
  "admin-panel": 3001,
  "kitchen-panel": 3002,
  "waiter-panel": 3004,
  "mobile-app": 3003,
};

const PRODUCTION_DOMAIN = "restorio.org";

const subdomainFromSlug = (appSlug: AppSlug): string =>
  appSlug.replace("-panel", "").replace("-web", "").replace("-app", "");

export const getAppUrl = (environment: EnvironmentType, appSlug: AppSlug): string => {
  if (environment === Environment.PRODUCTION) {
    if (appSlug === "public-web") {
      return `https://${PRODUCTION_DOMAIN}`;
    }

    return `https://${subdomainFromSlug(appSlug)}.${PRODUCTION_DOMAIN}`;
  }

  const port = LOCAL_PORTS[appSlug];

  return `http://localhost:${port}`;
};

export const getEnvironmentFromEnv = (mode: string): EnvironmentType => {
  if (mode === "production") {
    return Environment.PRODUCTION;
  }

  if (mode === "development") {
    return Environment.DEVELOPMENT;
  }

  return Environment.LOCAL;
};

export const getEnvMode = (): string => {
  const viteEnv =
    typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
  const processEnv = typeof process !== "undefined" ? (process.env as Record<string, unknown>) : undefined;
  const envSource = getEnvSource(viteEnv);

  return (
    resolveNextEnvVar(processEnv ?? {}, "ENV", "NODE_ENV") ??
    resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ??
    "development"
  );
};

export const getAppHref = (slug: AppSlug): string => {
  const envMode = getEnvMode();

  return getAppUrl(getEnvironmentFromEnv(envMode), slug);
};

export const getMergedRuntimeEnv = (): Record<string, unknown> => {
  const viteEnv =
    typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
  const processEnv = typeof process !== "undefined" ? (process.env as Record<string, unknown>) : undefined;

  return { ...(processEnv ?? {}), ...(viteEnv ?? {}) };
};

const APP_URL_OVERRIDE_KEYS: Partial<Record<AppSlug, readonly string[]>> = {
  "public-web": ["VITE_PUBLIC_WEB_URL", "NEXT_PUBLIC_PUBLIC_WEB_URL"],
  "admin-panel": ["VITE_ADMIN_PANEL_URL", "NEXT_PUBLIC_ADMIN_PANEL_URL"],
};

export const PUBLIC_WEB_LOCALE_PATH_PREFIX = "/pl";

export const getAppBaseUrl = (slug: AppSlug): string => {
  const keys = APP_URL_OVERRIDE_KEYS[slug];

  if (keys !== undefined && keys.length > 0) {
    const merged = getMergedRuntimeEnv();
    const override = resolveNextEnvVar(merged, ...keys);

    if (override !== undefined) {
      return override;
    }
  }

  return getAppHref(slug);
};

export const goToApp = (slug: AppSlug): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LAST_VISITED_APP_STORAGE_KEY, slug);
  window.location.href = getAppBaseUrl(slug);
};

export interface ResolveApiBaseUrlOptions {
  readonly preferRelativeInBrowser?: boolean;
}

export const resolveApiBaseUrl = (options?: ResolveApiBaseUrlOptions): string => {
  const merged = getMergedRuntimeEnv();
  const fromEnv = resolveNextEnvVar(merged, "VITE_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL");

  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv;
  }

  if (options?.preferRelativeInBrowser === true && typeof window !== "undefined") {
    return "/api/v1";
  }

  return "http://localhost:8000/api/v1";
};
