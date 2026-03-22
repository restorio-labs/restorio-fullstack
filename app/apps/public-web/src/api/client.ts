import { ApiClient, RestorioApi } from "@restorio/api-client";
import { resolveApiBaseUrl } from "@restorio/utils";

const API_BASE_URL = resolveApiBaseUrl({ preferRelativeInBrowser: true });

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
