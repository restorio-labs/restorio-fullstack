import { ApiClient, RestorioApi } from "@restorio/api-client";
import { getAppUrl, getEnvironmentFromEnv, resolveNextEnvVar, getEnvSource } from "@restorio/utils";

const viteEnv = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
const envSource = getEnvSource(viteEnv);
const envMode = resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ?? "development";
const apiBaseUrlEnv = resolveNextEnvVar(envSource, "VITE_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL");
const publicWebUrlEnv = resolveNextEnvVar(envSource, "VITE_PUBLIC_WEB_URL", "NEXT_PUBLIC_BASE_URL");

const getDefaultApiBaseUrl = (): string => {
  if (typeof apiBaseUrlEnv === "string" && apiBaseUrlEnv.length > 0) {
    return apiBaseUrlEnv;
  }

  return typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000/api/v1";
};

const API_BASE_URL = getDefaultApiBaseUrl();
const PUBLIC_WEB_URL = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

const accessTokenRef: { current: string | null } = { current: null };

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: (): string | null => accessTokenRef.current,
  onUnauthorized: (): void => {
    window.location.href = PUBLIC_WEB_URL;
  },
});

export const api = new RestorioApi(apiClient);

export const setAccessToken: (token: string | null) => void = (token) => {
  accessTokenRef.current = token;
};
