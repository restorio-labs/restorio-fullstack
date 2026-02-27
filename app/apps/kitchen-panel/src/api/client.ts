import { ApiClient, RestorioApi } from "@restorio/api-client";
import { TokenStorage } from "@restorio/auth";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;

const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  refreshPath: "auth/refresh",
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    window.location.href = "/login";
  },
});

export const api = new RestorioApi(apiClient);
