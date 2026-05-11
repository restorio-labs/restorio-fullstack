import { ApiClient, RestorioApi } from "@restorio/api-client";

const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "restorio.org"
    ? "https://api.restorio.org/api/v1"
    : "/api/v1";

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
