const PREVIEW_COOKIE_NAMES = new Set(["preview_rat", "preview_rrt", "preview_rshc", "preview_csrf_token"]);

export const filterPreviewCookies = (cookieHeader: string | null): string | null => {
  if (cookieHeader === null) {
    return null;
  }

  const previewCookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => PREVIEW_COOKIE_NAMES.has(cookie.split("=", 1)[0]));

  return previewCookies.length > 0 ? previewCookies.join("; ") : null;
};
