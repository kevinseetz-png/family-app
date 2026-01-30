import { describe, it, expect } from "vitest";
import { feedingSchema, feedingUpdateSchema } from "./validation";

describe("feedingSchema", () => {
  it("accepts valid feeding with foodType and unit", () => {
    const result = feedingSchema.safeParse({
      foodType: "breast_milk",
      amount: 120,
      unit: "ml",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all food types", () => {
    for (const foodType of ["breast_milk", "formula", "puree", "solid", "snack"]) {
      const result = feedingSchema.safeParse({ foodType, amount: 50, unit: "g" });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid food type", () => {
    const result = feedingSchema.safeParse({
      foodType: "pizza",
      amount: 100,
      unit: "ml",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid unit", () => {
    const result = feedingSchema.safeParse({
      foodType: "formula",
      amount: 100,
      unit: "oz",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing foodType", () => {
    const result = feedingSchema.safeParse({ amount: 100, unit: "ml" });
    expect(result.success).toBe(false);
  });

  it("rejects missing unit", () => {
    const result = feedingSchema.safeParse({ foodType: "formula", amount: 100 });
    expect(result.success).toBe(false);
  });

  it("does not accept babyName as substitute for foodType", () => {
    const result = feedingSchema.safeParse({
      babyName: "Test",
      amount: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("feedingUpdateSchema", () => {
  it("accepts valid update with foodType and unit", () => {
    const result = feedingUpdateSchema.safeParse({
      id: "abc123",
      foodType: "puree",
      amount: 50,
      unit: "g",
      timestamp: "2025-01-01T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects update without unit", () => {
    const result = feedingUpdateSchema.safeParse({
      id: "abc123",
      foodType: "puree",
      amount: 50,
      timestamp: "2025-01-01T12:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
