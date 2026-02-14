import { ApiClient, RestorioApi } from "@restorio/api-client";
import { TokenStorage } from "@restorio/auth";
import { getAppUrl, getEnvironmentFromMode } from "@restorio/utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const PUBLIC_WEB_URL =
  import.meta.env.VITE_PUBLIC_WEB_URL ?? getAppUrl(getEnvironmentFromMode(import.meta.env.MODE!), "public-web");

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    TokenStorage.clearTokens();
    window.location.href = PUBLIC_WEB_URL;
  },
});

export const api = new RestorioApi(apiClient);
