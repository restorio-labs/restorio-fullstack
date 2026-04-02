const ENV = import.meta.env as unknown as Record<string, unknown>;

const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;

export const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";
