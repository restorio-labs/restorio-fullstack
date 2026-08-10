import { filterPreviewCookies } from "../src/services/filterPreviewCookies";

export interface PreviewAuthEnv {
  PREVIEW_BASIC_AUTH_PASSWORD?: string;
  PREVIEW_BASIC_AUTH_USERNAME?: string;
}

const PREVIEW_API_ORIGIN = "https://preview-api.restorio.org";
const PROXIED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "origin",
  "referer",
  "x-csrf-token",
  "x-timezone",
];

export const previewAuthorizationHeader = (env: PreviewAuthEnv): string | null => {
  if (env.PREVIEW_BASIC_AUTH_USERNAME === undefined || env.PREVIEW_BASIC_AUTH_PASSWORD === undefined) {
    return null;
  }

  return `Basic ${btoa(`${env.PREVIEW_BASIC_AUTH_USERNAME}:${env.PREVIEW_BASIC_AUTH_PASSWORD}`)}`;
};

export const isPreviewAuthorized = (request: Request, env: PreviewAuthEnv): boolean => {
  const expected = previewAuthorizationHeader(env);

  return expected !== null && request.headers.get("Authorization") === expected;
};

export const createPreviewApiRequest = (request: Request, env: PreviewAuthEnv): Request => {
  const url = new URL(request.url);
  const apiUrl = new URL(`${url.pathname}${url.search}`, PREVIEW_API_ORIGIN);
  const headers = new Headers();

  for (const name of PROXIED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  const cookies = filterPreviewCookies(request.headers.get("Cookie"));
  if (cookies !== null) {
    headers.set("Cookie", cookies);
  }

  const authorization = previewAuthorizationHeader(env);
  if (authorization === null) {
    throw new Error("Preview Basic Auth is not configured");
  }
  headers.set("Authorization", authorization);

  return new Request(apiUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });
};
