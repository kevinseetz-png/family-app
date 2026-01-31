import { describe, it, expect } from "vitest";
import { moveUserSchema, deleteUserSchema } from "@/lib/validation";

describe("moveUserSchema", () => {
  it("should accept valid userId and targetFamilyId", () => {
    const result = moveUserSchema.safeParse({
      userId: "user123",
      targetFamilyId: "fam456",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        userId: "user123",
        targetFamilyId: "fam456",
      });
    }
  });

  it("should reject missing userId", () => {
    const result = moveUserSchema.safeParse({
      targetFamilyId: "fam456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required|expected string/i);
    }
  });

  it("should reject empty userId", () => {
    const result = moveUserSchema.safeParse({
      userId: "",
      targetFamilyId: "fam456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("User ID is required");
    }
  });

  it("should reject missing targetFamilyId", () => {
    const result = moveUserSchema.safeParse({
      userId: "user123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required|expected string/i);
    }
  });

  it("should reject empty targetFamilyId", () => {
    const result = moveUserSchema.safeParse({
      userId: "user123",
      targetFamilyId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Target family ID is required");
    }
  });
});

describe("deleteUserSchema", () => {
  it("should accept valid userId", () => {
    const result = deleteUserSchema.safeParse({
      userId: "user123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ userId: "user123" });
    }
  });

  it("should reject missing userId", () => {
    const result = deleteUserSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required|expected string/i);
    }
  });

  it("should reject empty userId", () => {
    const result = deleteUserSchema.safeParse({
      userId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("User ID is required");
    }
  });
});
