import { ApiClient, RestorioApi } from "@restorio/api-client";
import { TokenStorage } from "@restorio/auth";
import { resolveApiBaseUrl } from "@restorio/utils";

const apiClient = new ApiClient({
  baseURL: resolveApiBaseUrl({ preferRelativeInBrowser: true }),
  refreshPath: "auth/refresh",
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    window.location.href = "/";
  },
});

export const api = new RestorioApi(apiClient);
