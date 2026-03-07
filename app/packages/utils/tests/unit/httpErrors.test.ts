import { describe, expect, it } from "vitest";

import {
  getApiErrorData,
  getApiErrorMessage,
  getApiValidationFieldLeafs,
  getApiValidationFields,
} from "@restorio/utils";

describe("getApiErrorData", () => {
  it("extracts nested response data", () => {
    const error = { response: { data: { message: "Invalid request" } } };

    expect(getApiErrorData(error)).toEqual({ message: "Invalid request" });
  });

  it("returns undefined for non-objects", () => {
    expect(getApiErrorData("boom")).toBeUndefined();
  });
});

describe("getApiErrorMessage", () => {
  it("prefers detail when detail is a non-empty string", () => {
    expect(getApiErrorMessage({ detail: "Detailed message", message: "Fallback" })).toBe("Detailed message");
  });

  it("falls back to message when detail is not a string", () => {
    expect(getApiErrorMessage({ detail: [{ loc: ["body", "email"] }], message: "Fallback" })).toBe("Fallback");
  });
});

describe("getApiValidationFields", () => {
  it("returns fields from ValidationErrorResponse payload", () => {
    expect(getApiValidationFields({ fields: ["email", "password"] })).toEqual(["email", "password"]);
  });

  it("extracts dotted paths from FastAPI-style detail payload", () => {
    expect(
      getApiValidationFields({
        detail: [{ loc: ["body", "email"] }, { loc: ["body", "credentials", "password"] }],
      }),
    ).toEqual(["email", "credentials.password"]);
  });

  it("deduplicates fields coming from both formats", () => {
    expect(getApiValidationFields({ fields: ["email"], detail: [{ loc: ["body", "email"] }] })).toEqual(["email"]);
  });
});

describe("getApiValidationFieldLeafs", () => {
  it("returns lowercase leaf segments from validation paths", () => {
    expect(getApiValidationFieldLeafs({ fields: ["credentials.email", "Password"] })).toEqual(["email", "password"]);
  });
});
