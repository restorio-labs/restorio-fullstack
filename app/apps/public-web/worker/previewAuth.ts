export interface PreviewAuthEnv {
  PREVIEW_BASIC_AUTH_PASSWORD?: string;
  PREVIEW_BASIC_AUTH_USERNAME?: string;
}

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
