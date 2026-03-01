import { ApiClient, RestorioApi } from "@restorio/api-client";
import { TokenStorage } from "@restorio/auth";
import { getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const envMode = typeof ENV.ENV === "string" ? ENV.ENV : "development";
const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;
const publicWebUrlEnv = typeof ENV.VITE_PUBLIC_WEB_URL === "string" ? ENV.VITE_PUBLIC_WEB_URL : undefined;

const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";
const PUBLIC_WEB_URL = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  refreshPath: "auth/refresh",
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    window.location.href = `${PUBLIC_WEB_URL}/login`;
  },
});

export const api = new RestorioApi(apiClient);
