import { registerSchema } from "./validation";

describe("registerSchema with inviteCode", () => {
  it("accepts valid registration with invite code", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "Password1234",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects registration without invite code", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "Password1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects registration with empty invite code", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "Password1234",
      inviteCode: "",
    });
    expect(result.success).toBe(false);
  });
});
