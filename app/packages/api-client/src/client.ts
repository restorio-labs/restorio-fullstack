import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
  refreshPath?: string;
  tokenExpiryBufferMs?: number;
}

interface AxiosErrorWithConfig {
  response?: { status?: number };
  config?: AxiosRequestConfig & { _retry?: boolean };
}

const decodeTokenExp = (token: string): number | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const payload = JSON.parse(jsonPayload) as { exp?: number };

    return payload.exp ?? null;
  } catch {
    return null;
  }
};

const isTokenExpiringSoon = (token: string, bufferMs: number): boolean => {
  const exp = decodeTokenExp(token);

  if (exp === null) {
    return false;
  }

  return Date.now() >= exp * 1000 - bufferMs;
};

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private refreshPromise: Promise<boolean> | null = null;
  private tokenExpiryBufferMs: number;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.tokenExpiryBufferMs = config.tokenExpiryBufferMs ?? 60_000;
    this.client = axios.create({
      baseURL: config.baseURL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(async (requestConfig: InternalAxiosRequestConfig) => {
      const token = this.config.getAccessToken?.();

      if (token && requestConfig.headers.Authorization === undefined) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      const { refreshPath } = this.config;
      const requestUrl = requestConfig.url ?? "";
      const isRefreshRequest =
        refreshPath != null && (requestUrl === refreshPath || requestUrl.endsWith(`/${refreshPath}`));

      if (!isRefreshRequest && refreshPath != null && token && isTokenExpiringSoon(token, this.tokenExpiryBufferMs)) {
        await this.doRefresh();
      }

      return requestConfig;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosErrorWithConfig) => {
        if (error.response?.status !== 401) {
          return Promise.reject(error);
        }

        const { refreshPath } = this.config;
        const requestUrl = error.config?.url ?? "";
        const isRefreshRequest =
          refreshPath != null && (requestUrl === refreshPath || requestUrl.endsWith(`/${refreshPath}`));

        if (error.config?._retry === true || isRefreshRequest || refreshPath == null) {
          this.config.onUnauthorized?.();

          return Promise.reject(error);
        }

        const refreshed = await this.doRefresh();
        const { config } = error;

        if (!refreshed || config == null) {
          this.config.onUnauthorized?.();

          return Promise.reject(error);
        }

        config._retry = true;

        return this.client.request(config);
      },
    );
  }

  private doRefresh(): Promise<boolean> {
    if (this.refreshPromise != null) {
      return this.refreshPromise;
    }

    const { refreshPath } = this.config;

    if (refreshPath == null) {
      return Promise.resolve(false);
    }

    this.refreshPromise = this.client
      .post(refreshPath, undefined, { withCredentials: true })
      .then(() => {
        this.refreshPromise = null;

        return true;
      })
      .catch(() => {
        this.refreshPromise = null;

        return false;
      });

    return this.refreshPromise;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);

    return response.data;
  }

  async post<T, TBody extends object = object>(url: string, data?: TBody, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);

    return response.data;
  }

  async put<T, TBody extends object = object>(url: string, data?: TBody, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);

    return response.data;
  }

  async patch<T, TBody extends object = object>(url: string, data?: TBody, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);

    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);

    return response.data;
  }
}
