import { isPreviewAuthorized, previewAuthorizationHeader } from "../../../worker/previewAuth";

const previewEnv = {
  PREVIEW_BASIC_AUTH_USERNAME: "preview-user",
  PREVIEW_BASIC_AUTH_PASSWORD: "preview-password",
};

describe("preview authentication", () => {
  it("accepts only the configured Basic Auth credentials", () => {
    const authorization = previewAuthorizationHeader(previewEnv);
    const authorizedRequest = new Request("https://preview.restorio.org", {
      headers: { Authorization: authorization ?? "" },
    });

    expect(isPreviewAuthorized(authorizedRequest, previewEnv)).toBe(true);
    expect(isPreviewAuthorized(new Request("https://preview.restorio.org"), previewEnv)).toBe(false);
  });
});
