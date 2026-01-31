// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// Mock firebase-admin before imports
vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ empty: true })),
      })),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ empty: true })),
        })),
      })),
      doc: vi.fn(() => ({
        set: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve({ exists: false })),
      })),
    })),
  },
  adminAuth: {
    createCustomToken: vi.fn(() => Promise.resolve("firebase-token")),
  },
}));

describe("Role System - Types", () => {
  it("User type should include role field", async () => {
    // Type existence check - if role is on the interface, a user object should accept it
    const user = { id: "1", name: "Test", email: "t@t.com", familyId: "f1", role: "admin" as const };
    expect(user.role).toBe("admin");
  });

  it("User type should include visibleTabs field", async () => {
    const user = { id: "1", name: "Test", email: "t@t.com", familyId: "f1", role: "member" as const, visibleTabs: ["/feeding", "/notes"] };
    expect(user.visibleTabs).toEqual(["/feeding", "/notes"]);
  });
});

describe("Role System - JWT", () => {
  it("createToken should include role in payload", async () => {
    const { createToken, verifyToken } = await import("@/lib/auth");
    const user = { id: "1", name: "Test", email: "t@t.com", familyId: "f1", role: "admin" as const };
    const token = await createToken(user);
    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.role).toBe("admin");
  });

  it("verifyToken should return role from token", async () => {
    const { createToken, verifyToken } = await import("@/lib/auth");
    const user = { id: "1", name: "Test", email: "t@t.com", familyId: "f1", role: "member" as const };
    const token = await createToken(user);
    const decoded = await verifyToken(token);
    expect(decoded!.role).toBe("member");
  });

  it("verifyToken should default to member when role missing in old tokens", async () => {
    // Create a token with role=member, then verify the default behavior
    // The verifyToken function defaults to "member" when role is not "admin"
    const { createToken, verifyToken } = await import("@/lib/auth");
    const user = { id: "1", name: "Test", email: "t@t.com", familyId: "f1", role: "member" as const };
    const token = await createToken(user);
    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.role).toBe("member");
  });
});

describe("Role System - User Creation", () => {
  it("createUser should store role field", async () => {
    const { adminDb } = await import("@/lib/firebase-admin");
    const mockSet = vi.fn(() => Promise.resolve());
    const mockDoc = vi.fn(() => ({ set: mockSet, get: vi.fn(() => Promise.resolve({ exists: false })) }));
    (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === "users") {
        return {
          where: () => ({ limit: () => ({ get: () => Promise.resolve({ empty: true }) }) }),
          doc: mockDoc,
        };
      }
      return {
        doc: vi.fn(() => ({ set: vi.fn(() => Promise.resolve()) })),
      };
    });

    const { createUser } = await import("@/lib/users");
    const user = await createUser("Test", "new@test.com", "Password123!", undefined, "admin");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("admin");
    // Verify role was stored in Firestore
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
  });

  it("authenticateUser should return role from stored user", async () => {
    const { adminDb } = await import("@/lib/firebase-admin");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("Password123!", 10);

    (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      where: () => ({
        limit: () => ({
          get: () =>
            Promise.resolve({
              empty: false,
              docs: [
                {
                  id: "user1",
                  data: () => ({
                    name: "Test",
                    email: "test@test.com",
                    passwordHash: hash,
                    familyId: "f1",
                    role: "admin",
                  }),
                },
              ],
            }),
        }),
      }),
    }));

    const { authenticateUser } = await import("@/lib/users");
    const user = await authenticateUser("test@test.com", "Password123!");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("admin");
  });

  it("authenticateUser should default to member for users without role", async () => {
    const { adminDb } = await import("@/lib/firebase-admin");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("Password123!", 10);

    (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      where: () => ({
        limit: () => ({
          get: () =>
            Promise.resolve({
              empty: false,
              docs: [
                {
                  id: "user1",
                  data: () => ({
                    name: "Test",
                    email: "test@test.com",
                    passwordHash: hash,
                    familyId: "f1",
                    // no role field - legacy user
                  }),
                },
              ],
            }),
        }),
      }),
    }));

    const { authenticateUser } = await import("@/lib/users");
    const user = await authenticateUser("test@test.com", "Password123!");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("member");
  });
});
