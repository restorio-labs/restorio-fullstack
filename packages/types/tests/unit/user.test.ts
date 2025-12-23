import { describe, it, expect } from "vitest";

import { UserRole } from "../../src/user";

describe("User Types", () => {
  it("should have all required user roles", () => {
    expect(UserRole.SUPER_ADMIN).toBe("super_admin");
    expect(UserRole.OWNER).toBe("owner");
    expect(UserRole.MANAGER).toBe("manager");
    expect(UserRole.WAITER).toBe("waiter");
    expect(UserRole.KITCHEN_STAFF).toBe("kitchen_staff");
    expect(UserRole.ADMIN).toBe("admin");
  });
});
