import { ApiClient, RestorioApi } from "@restorio/api-client";
import { getAppUrl, getEnvironmentFromEnv, resolveNextEnvVar, getEnvSource } from "@restorio/utils";

const viteEnv = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
const envSource = getEnvSource(viteEnv);
const envMode = resolveNextEnvVar(envSource, "ENV", "NODE_ENV") ?? "development";
const apiBaseUrlEnv = resolveNextEnvVar(envSource, "VITE_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL");
const publicWebUrlEnv = resolveNextEnvVar(envSource, "VITE_PUBLIC_WEB_URL", "NEXT_PUBLIC_BASE_URL");

const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";
const PUBLIC_WEB_URL = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  onUnauthorized: (): void => {
    window.location.href = PUBLIC_WEB_URL;
  },
});

export const api = new RestorioApi(apiClient);
