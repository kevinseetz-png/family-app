// @vitest-environment node
import { createToken, verifyToken } from "./auth";
import type { User } from "@/types/auth";

describe("createToken", () => {
  const user: User = { id: "u1", name: "Alice", email: "alice@example.com" };

  it("returns a JWT string", async () => {
    const token = await createToken(user);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });
});

describe("verifyToken", () => {
  const user: User = { id: "u1", name: "Alice", email: "alice@example.com" };

  it("returns user data for a valid token", async () => {
    const token = await createToken(user);
    const result = await verifyToken(token);
    expect(result).toEqual(user);
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await createToken(user);
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const result = await verifyToken("");
    expect(result).toBeNull();
  });
});
