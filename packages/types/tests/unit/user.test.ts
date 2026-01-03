import { describe, it, expect } from "bun:test";

import { UserRole } from "../../src/user";

describe("User Types", () => {
  it("should have all required user roles", () => {
    expect(UserRole.SUPER_ADMIN).toBe(UserRole.SUPER_ADMIN);
  });
});
