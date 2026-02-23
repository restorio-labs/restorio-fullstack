const ACCESS_TOKEN_COOKIE_NAME = "restorio_access_token";

export const getAccessTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${ACCESS_TOKEN_COOKIE_NAME}=`;
  const cookies = document.cookie.split(";");

  for (const rawCookie of cookies) {
    const cookie = rawCookie.trim();

    if (cookie.startsWith(prefix)) {
      const value = cookie.slice(prefix.length);

      return value.length > 0 ? decodeURIComponent(value) : null;
    }
  }

  return null;
};

export const setAccessTokenCookie = (token: string): void => {
  if (typeof document === "undefined") {
    return;
  }

  if (token.trim().length === 0) {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
};
