import { Environment, type AppSlug, type EnvironmentType } from "@restorio/types";

const LOCAL_PORTS: Record<AppSlug, number> = {
  "public-web": 3000,
  "admin-panel": 3001,
  "kitchen-panel": 3002,
  "waiter-panel": 3004,
  "mobile-app": 3003,
};

const PRODUCTION_DOMAIN = "restorio.com";

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
