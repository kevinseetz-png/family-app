import { describe, it, expect } from "vitest";
import {
  picnicLoginSchema,
  picnicSearchSchema,
  picnicCartAddSchema,
} from "./validation";

describe("picnicLoginSchema", () => {
  it("should accept valid login data", () => {
    const result = picnicLoginSchema.safeParse({
      username: "user@example.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty username", () => {
    const result = picnicLoginSchema.safeParse({
      username: "",
      password: "mypassword",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const result = picnicLoginSchema.safeParse({
      username: "user@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = picnicLoginSchema.safeParse({
      username: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("picnicSearchSchema", () => {
  it("should accept valid search query", () => {
    const result = picnicSearchSchema.safeParse({ query: "melk" });
    expect(result.success).toBe(true);
  });

  it("should reject empty query", () => {
    const result = picnicSearchSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("should reject query over 100 characters", () => {
    const result = picnicSearchSchema.safeParse({ query: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("picnicCartAddSchema", () => {
  it("should accept valid product add", () => {
    const result = picnicCartAddSchema.safeParse({
      productId: "product-123",
      count: 2,
    });
    expect(result.success).toBe(true);
  });

  it("should default count to 1", () => {
    const result = picnicCartAddSchema.safeParse({
      productId: "product-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(1);
    }
  });

  it("should reject missing productId", () => {
    const result = picnicCartAddSchema.safeParse({ count: 1 });
    expect(result.success).toBe(false);
  });

  it("should reject count of 0", () => {
    const result = picnicCartAddSchema.safeParse({
      productId: "product-123",
      count: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject count over 99", () => {
    const result = picnicCartAddSchema.safeParse({
      productId: "product-123",
      count: 100,
    });
    expect(result.success).toBe(false);
  });
});
