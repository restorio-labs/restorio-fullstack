import { APP_SLUGS, Environment } from "@restorio/types";
import { describe, expect, it } from "vitest";

import { getAppUrl, getEnvironmentFromEnv, redirectTo } from "@restorio/utils";

describe("Environment", () => {
  it("defines the supported runtime environments", () => {
    expect(Environment).toEqual({
      PRODUCTION: "production",
      DEVELOPMENT: "development",
      LOCAL: "local",
    });
  });

  it("uses lowercase string values", () => {
    expect(Object.values(Environment)).toEqual(["production", "development", "local"]);
  });
});

describe("APP_SLUGS", () => {
  it("contains all supported app slugs in stable order", () => {
    expect(APP_SLUGS).toEqual(["public-web", "admin-panel", "kitchen-panel", "waiter-panel", "mobile-app"]);
  });

  it("does not contain duplicate slugs", () => {
    expect(new Set(APP_SLUGS).size).toBe(APP_SLUGS.length);
  });
});

describe("getAppUrl", () => {
  it("returns root production domain for public web", () => {
    expect(getAppUrl(Environment.PRODUCTION, "public-web")).toBe("https://restorio.com");
  });

  it("returns subdomain production urls for non-public apps", () => {
    expect(getAppUrl(Environment.PRODUCTION, "admin-panel")).toBe("https://admin.restorio.com");
    expect(getAppUrl(Environment.PRODUCTION, "mobile-app")).toBe("https://mobile.restorio.com");
  });

  it("returns localhost urls for development", () => {
    expect(getAppUrl(Environment.DEVELOPMENT, "public-web")).toBe("http://localhost:3000");
    expect(getAppUrl(Environment.DEVELOPMENT, "admin-panel")).toBe("http://localhost:3001");
    expect(getAppUrl(Environment.DEVELOPMENT, "kitchen-panel")).toBe("http://localhost:3002");
    expect(getAppUrl(Environment.DEVELOPMENT, "mobile-app")).toBe("http://localhost:3003");
    expect(getAppUrl(Environment.DEVELOPMENT, "waiter-panel")).toBe("http://localhost:3004");
  });

  it("returns localhost urls for local", () => {
    expect(getAppUrl(Environment.LOCAL, "public-web")).toBe("http://localhost:3000");
  });
});

describe("getEnvironmentFromEnv", () => {
  it("maps production mode", () => {
    expect(getEnvironmentFromEnv("production")).toBe(Environment.PRODUCTION);
  });

  it("maps development mode", () => {
    expect(getEnvironmentFromEnv("development")).toBe(Environment.DEVELOPMENT);
  });

  it("falls back to local for unknown mode", () => {
    expect(getEnvironmentFromEnv("test")).toBe(Environment.LOCAL);
  });
});

describe("redirectTo", () => {
  it("returns the public web url for provided environment", () => {
    expect(redirectTo(Environment.PRODUCTION)).toBe("https://restorio.com");
    expect(redirectTo(Environment.LOCAL)).toBe("http://localhost:3000");
  });
});

describe("utils barrel exports", () => {
  it("exposes environment helpers from root index", () => {
    expect(typeof getAppUrl).toBe("function");
    expect(typeof getEnvironmentFromEnv).toBe("function");
    expect(typeof redirectTo).toBe("function");
  });
});
