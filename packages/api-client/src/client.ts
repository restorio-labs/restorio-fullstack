import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((requestConfig) => {
      const token = this.config.getAccessToken?.();

      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      return requestConfig;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: { response?: { status?: number } }) => {
        if (error.response?.status === 401) {
          this.config.onUnauthorized?.();
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);

    return response.data;
  }

  async post<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);

    return response.data;
  }

  async put<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);

    return response.data;
  }

  async patch<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);

    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);

    return response.data;
  }
}

