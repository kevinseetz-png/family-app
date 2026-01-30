import { createUser, authenticateUser } from "./users";

// The users module uses an in-memory array, so tests share state.
// We use unique emails per test to avoid collisions.

describe("createUser", () => {
  it("creates a user and returns user without password", async () => {
    const user = await createUser("Alice", "alice-create@test.com", "password123");
    expect(user).not.toBeNull();
    expect(user!.name).toBe("Alice");
    expect(user!.email).toBe("alice-create@test.com");
    expect(user!.id).toBeDefined();
    expect((user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("returns null for duplicate email", async () => {
    await createUser("Bob", "dup@test.com", "password123");
    const dup = await createUser("Bob2", "dup@test.com", "password456");
    expect(dup).toBeNull();
  });
});

describe("authenticateUser", () => {
  it("authenticates with correct credentials", async () => {
    await createUser("Charlie", "charlie@test.com", "mypassword");
    const user = await authenticateUser("charlie@test.com", "mypassword");
    expect(user).not.toBeNull();
    expect(user!.email).toBe("charlie@test.com");
  });

  it("returns null for wrong password", async () => {
    await createUser("Dave", "dave@test.com", "correctpw");
    const user = await authenticateUser("dave@test.com", "wrongpw");
    expect(user).toBeNull();
  });

  it("returns null for non-existent email", async () => {
    const user = await authenticateUser("nobody@test.com", "password");
    expect(user).toBeNull();
  });
});
