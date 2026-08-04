import { describe, expect, it } from "vitest";

import {
  canAccessApp,
  resolveAuthenticatedAppRedirect,
  resolveDefaultAppForCapabilities,
} from "../../src/environment/resolveAuthenticatedAppRedirect";

const admin = ["app.admin.access", "app.waiter.access", "app.kitchen.access"];
const waiter = ["app.waiter.access"];
const kitchen = ["app.kitchen.access"];

describe("resolveAuthenticatedAppRedirect", () => {
  it("returns the capability default when the last app is inaccessible", () => {
    expect(resolveAuthenticatedAppRedirect(waiter, "admin-panel")).toBe("waiter-panel");
    expect(resolveAuthenticatedAppRedirect(kitchen, "admin-panel")).toBe("kitchen-panel");
  });

  it("returns a granted last visited app", () => {
    expect(resolveAuthenticatedAppRedirect(admin, "kitchen-panel")).toBe("kitchen-panel");
    expect(resolveAuthenticatedAppRedirect(waiter, "waiter-panel")).toBe("waiter-panel");
  });

  it("ignores public-web and unknown last visited values", () => {
    expect(resolveAuthenticatedAppRedirect(waiter, "public-web")).toBe("waiter-panel");
    expect(resolveAuthenticatedAppRedirect(waiter, "not-an-app")).toBe("waiter-panel");
  });
});

describe("resolveDefaultAppForCapabilities", () => {
  it("prefers admin and maps dedicated staff panels", () => {
    expect(resolveDefaultAppForCapabilities(admin)).toBe("admin-panel");
    expect(resolveDefaultAppForCapabilities(waiter)).toBe("waiter-panel");
    expect(resolveDefaultAppForCapabilities(kitchen)).toBe("kitchen-panel");
  });
});

describe("canAccessApp", () => {
  it("checks application capabilities instead of roles", () => {
    expect(canAccessApp(waiter, "admin-panel")).toBe(false);
    expect(canAccessApp(waiter, "waiter-panel")).toBe(true);
    expect(canAccessApp(kitchen, "kitchen-panel")).toBe(true);
  });
});
