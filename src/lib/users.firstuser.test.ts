import { describe, it, expect, beforeEach } from "vitest";

describe("hasUsers", () => {
  beforeEach(async () => {
    // Reset the in-memory store between tests
    const mod = await import("@/lib/users");
    if ("resetUsers" in mod && typeof mod.resetUsers === "function") {
      (mod as { resetUsers: () => void }).resetUsers();
    }
  });

  it("should be exported from users module", async () => {
    const mod = await import("@/lib/users");
    expect(mod).toHaveProperty("hasUsers");
    expect(typeof mod.hasUsers).toBe("function");
  });

  it("should return false when no users exist", async () => {
    const { hasUsers } = await import("@/lib/users");
    expect(hasUsers()).toBe(false);
  });

  it("should return true after a user is created", async () => {
    const { hasUsers, createUser } = await import("@/lib/users");
    await createUser("Test User", "test@example.com", "password123");
    expect(hasUsers()).toBe(true);
  });
});
