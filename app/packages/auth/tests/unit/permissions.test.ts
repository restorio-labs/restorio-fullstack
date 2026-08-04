import { describe, expect, it } from "vitest";

import { hasAllCapabilities, hasAnyCapability, hasCapability } from "../../src/permissions";

const capabilities = ["menu.read", "menu.write", "order.read"];

describe("capability helpers", () => {
  it("checks one capability", () => {
    expect(hasCapability(capabilities, "menu.write")).toBe(true);
    expect(hasCapability(capabilities, "staff.create")).toBe(false);
  });

  it("checks any and all capability requirements", () => {
    expect(hasAnyCapability(capabilities, ["staff.create", "order.read"])).toBe(true);
    expect(hasAllCapabilities(capabilities, ["menu.read", "menu.write"])).toBe(true);
    expect(hasAllCapabilities(capabilities, ["menu.read", "staff.create"])).toBe(false);
  });
});
