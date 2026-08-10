import {
  createPreviewApiRequest,
  isPreviewAuthorized,
  previewAuthorizationHeader,
} from "../../../worker/previewApiProxy";

const previewEnv = {
  PREVIEW_BASIC_AUTH_USERNAME: "preview-user",
  PREVIEW_BASIC_AUTH_PASSWORD: "preview-password",
};

describe("preview API proxy", () => {
  it("accepts only the configured Basic Auth credentials", () => {
    const authorization = previewAuthorizationHeader(previewEnv);
    const authorizedRequest = new Request("https://preview.restorio.org/api/v1/health", {
      headers: { Authorization: authorization ?? "" },
    });

    expect(isPreviewAuthorized(authorizedRequest, previewEnv)).toBe(true);
    expect(isPreviewAuthorized(new Request("https://preview.restorio.org/api/v1/health"), previewEnv)).toBe(false);
  });

  it("proxies only preview cookies and required request headers", () => {
    const request = new Request("https://preview.restorio.org/api/v1/health?verbose=true", {
      headers: {
        Accept: "application/json",
        Authorization: "Basic client-value",
        Cookie:
          "rrt=production; preview_rat=preview-access; preview_csrf_token=preview-csrf; csrf_token=production-csrf",
        Host: "preview.restorio.org",
        "X-Timezone": "Europe/Warsaw",
        "X-Untrusted": "drop-me",
      },
    });

    const proxied = createPreviewApiRequest(request, previewEnv);

    expect(proxied.url).toBe("https://preview-api.restorio.org/api/v1/health?verbose=true");
    expect(proxied.headers.get("Authorization")).toBe(previewAuthorizationHeader(previewEnv));
    expect(proxied.headers.get("Cookie")).toBe("preview_rat=preview-access; preview_csrf_token=preview-csrf");
    expect(proxied.headers.get("Host")).toBeNull();
    expect(proxied.headers.get("X-Timezone")).toBe("Europe/Warsaw");
    expect(proxied.headers.get("X-Untrusted")).toBeNull();
  });
});
