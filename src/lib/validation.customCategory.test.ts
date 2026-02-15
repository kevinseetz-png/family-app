import { describe, it, expect } from "vitest";
import {
  customCategorySchema,
  customCategoryDeleteSchema,
} from "./validation";

describe("customCategorySchema", () => {
  it("accepts valid custom category", () => {
    const result = customCategorySchema.safeParse({
      label: "Huisdier",
      emoji: "🐕",
      colorScheme: "groen",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty label", () => {
    const result = customCategorySchema.safeParse({
      label: "",
      emoji: "🐕",
      colorScheme: "groen",
    });
    expect(result.success).toBe(false);
  });

  it("rejects label longer than 50 characters", () => {
    const result = customCategorySchema.safeParse({
      label: "a".repeat(51),
      emoji: "🐕",
      colorScheme: "groen",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty emoji", () => {
    const result = customCategorySchema.safeParse({
      label: "Huisdier",
      emoji: "",
      colorScheme: "groen",
    });
    expect(result.success).toBe(false);
  });

  it("rejects emoji longer than 10 characters", () => {
    const result = customCategorySchema.safeParse({
      label: "Huisdier",
      emoji: "a".repeat(11),
      colorScheme: "groen",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty colorScheme", () => {
    const result = customCategorySchema.safeParse({
      label: "Huisdier",
      emoji: "🐕",
      colorScheme: "",
    });
    expect(result.success).toBe(false);
  });

  it("trims label", () => {
    const result = customCategorySchema.safeParse({
      label: "  Huisdier  ",
      emoji: "🐕",
      colorScheme: "groen",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe("Huisdier");
    }
  });
});

describe("customCategoryDeleteSchema", () => {
  it("accepts valid delete", () => {
    const result = customCategoryDeleteSchema.safeParse({ id: "cat1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty id", () => {
    const result = customCategoryDeleteSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
