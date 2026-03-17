import { ApiClient, RestorioApi } from "@restorio/api-client";
import { resolveNextEnvVar, getEnvSource } from "@restorio/utils";

const viteEnv = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
const envSource = getEnvSource(viteEnv);
const apiBaseUrlEnv = resolveNextEnvVar(envSource, "VITE_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL");

const getDefaultApiBaseUrl = (): string => {
  if (typeof apiBaseUrlEnv === "string" && apiBaseUrlEnv.length > 0) {
    return apiBaseUrlEnv;
  }

  return typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000/api/v1";
};

const API_BASE_URL = getDefaultApiBaseUrl();

const accessTokenRef: { current: string | null } = { current: null };

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: (): string | null => accessTokenRef.current,
  refreshPath: "auth/refresh",
});

export const api = new RestorioApi(apiClient);

export const setAccessToken: (token: string | null) => void = (token) => {
  accessTokenRef.current = token;
};
