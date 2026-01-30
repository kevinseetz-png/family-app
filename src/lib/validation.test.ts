import { loginSchema, registerSchema } from "./validation";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid email address");
    }
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid name, email, password, and inviteCode", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "a@b.com",
      password: "password123",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects name over 100 characters", () => {
    const result = registerSchema.safeParse({
      name: "a".repeat(101),
      email: "a@b.com",
      password: "password123",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "a@b.com",
      password: "short",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
    }
  });

  it("rejects password over 128 characters", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "a@b.com",
      password: "a".repeat(129),
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "bad",
      password: "password123",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });
});
