import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
  refreshPath?: string;
}

interface AxiosErrorWithConfig {
  response?: { status?: number };
  config?: AxiosRequestConfig & { _retry?: boolean };
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((requestConfig) => {
      const token = this.config.getAccessToken?.();

      if (token && requestConfig.headers.Authorization === undefined) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
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

        const doRefresh = (): Promise<boolean> => {
          if (this.refreshPromise != null) {
            return this.refreshPromise;
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
        };

        const refreshed = await doRefresh();
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
