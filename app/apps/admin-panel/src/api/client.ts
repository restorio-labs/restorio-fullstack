import { ApiClient, RestorioApi } from "@restorio/api-client";
import { TokenStorage } from "@restorio/auth";

import { API_BASE_URL, PUBLIC_WEB_URL } from "../config";

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  refreshPath: "auth/refresh",
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    window.location.href = `${PUBLIC_WEB_URL}/login`;
  },
});

export const api = new RestorioApi(apiClient);
