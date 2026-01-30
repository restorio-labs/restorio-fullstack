interface EnvSource {
  env?: Record<string, string | undefined>;
}

const getEnvVar = (key: string): string | undefined => {
  const processEnv = (globalThis as { process?: EnvSource }).process?.env;
  const viteEnv = (import.meta as EnvSource).env;

  return processEnv?.[key] ?? viteEnv?.[key];
};

const ACCESS_TOKEN_KEY = getEnvVar("ACCESS_TOKEN_KEY") ?? "restorio_access_token";
const REFRESH_TOKEN_KEY = getEnvVar("REFRESH_TOKEN_KEY") ?? "restorio_refresh_token";

const getLocalStorage = (): Storage | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
};

export class TokenStorage {
  static getAccessToken(): string | null {
    const storage = getLocalStorage();

    if (storage === undefined) {
      return null;
    }

    return storage.getItem(ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    const storage = getLocalStorage();

    if (storage === undefined) {
      return;
    }

    storage.setItem(ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    const storage = getLocalStorage();

    if (storage === undefined) {
      return null;
    }

    return storage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    const storage = getLocalStorage();

    if (storage === undefined) {
      return;
    }

    storage.setItem(REFRESH_TOKEN_KEY, token);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  static clearTokens(): void {
    const storage = getLocalStorage();

    if (storage === undefined) {
      return;
    }

    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  }

  static decodeToken(token: string): Record<string, string> | null {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      );

      return JSON.parse(jsonPayload) as Record<string, string>;
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);

    if (!decoded?.exp) {
      return true;
    }

    return Date.now() >= Number(decoded.exp) * 1000;
  }

  static isAccessTokenValid(token: string): boolean {
    const codePattern = /^\d{3}-\d{3}$/;

    if (codePattern.test(token)) {
      return true;
    }

    return !this.isTokenExpired(token);
  }
}
