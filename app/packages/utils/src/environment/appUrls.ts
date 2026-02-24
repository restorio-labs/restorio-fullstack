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
  const envSource = getEnvSource(viteEnv);

  return resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ?? "development";
};

export const getAppHref = (slug: AppSlug): string => {
  const envMode = getEnvMode();

  return getAppUrl(getEnvironmentFromEnv(envMode), slug);
};

export const goToApp = (slug: AppSlug): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LAST_VISITED_APP_STORAGE_KEY, slug);
  window.location.href = getAppHref(slug);
};
