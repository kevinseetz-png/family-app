import { describe, it, expect } from "vitest";
import {
  klusjesSchema,
  klusjesUpdateSchema,
  klusjesDeleteSchema,
} from "./validation";

describe("klusjesSchema", () => {
  it("accepts valid klusje with name", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = klusjesSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects missing name", () => {
    const result = klusjesSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects name that is too long", () => {
    const result = klusjesSchema.safeParse({ name: "a".repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is too long");
    }
  });

  it("accepts name at max length", () => {
    const result = klusjesSchema.safeParse({ name: "a".repeat(200) });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name", () => {
    const result = klusjesSchema.safeParse({ name: "  Stofzuigen  " });
    expect(result.success).toBe(true);
  });
});

describe("klusjesUpdateSchema", () => {
  it("accepts valid update with id and checked", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      checked: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = klusjesUpdateSchema.safeParse({ checked: true });
    expect(result.success).toBe(false);
  });

  it("rejects missing checked", () => {
    const result = klusjesUpdateSchema.safeParse({ id: "klusje123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty id", () => {
    const result = klusjesUpdateSchema.safeParse({ id: "", checked: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid request");
    }
  });

  it("accepts checked as false", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      checked: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean checked", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      checked: "true",
    });
    expect(result.success).toBe(false);
  });
});

describe("klusjesDeleteSchema", () => {
  it("accepts valid delete with id", () => {
    const result = klusjesDeleteSchema.safeParse({ id: "klusje123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = klusjesDeleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty id", () => {
    const result = klusjesDeleteSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid request");
    }
  });
});
