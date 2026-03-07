import { getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";

const ENV = import.meta.env as unknown as Record<string, unknown>;

const envMode = typeof ENV.ENV === "string" ? ENV.ENV : "development";
const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;
const publicWebUrlEnv = typeof ENV.VITE_PUBLIC_WEB_URL === "string" ? ENV.VITE_PUBLIC_WEB_URL : undefined;

export const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";
export const PUBLIC_WEB_URL: string = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

export const AUTH_REVALIDATE_INTERVAL_MS = ((): number => {
  const envValue =
    typeof ENV.VITE_AUTH_REVALIDATE_INTERVAL_MS === "string" ? Number(ENV.VITE_AUTH_REVALIDATE_INTERVAL_MS) : undefined;

  if (Number.isFinite(envValue) && envValue !== undefined && envValue > 0) {
    return envValue;
  }

  return 15 * 60 * 1000; // default to 15 minutes
})();
