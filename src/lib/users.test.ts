import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn(() => ({ set: mockSet }));
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockGetResult = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      limit: mockLimit,
    })),
  },
}));

// Chain: .where().limit().get()
beforeEach(() => {
  vi.clearAllMocks();
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ get: mockGetResult });
});

import { createUser, authenticateUser } from "./users";

describe("createUser", () => {
  it("creates a user and returns user without password", async () => {
    // No existing user with this email
    mockGetResult.mockResolvedValue({ empty: true });

    const user = await createUser("Alice", "alice@test.com", "password123");
    expect(user).not.toBeNull();
    expect(user!.name).toBe("Alice");
    expect(user!.email).toBe("alice@test.com");
    expect(user!.id).toBeDefined();
    expect(user!.familyId).toBeDefined();
    expect((user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("returns null for duplicate email", async () => {
    mockGetResult.mockResolvedValue({ empty: false });
    const dup = await createUser("Bob2", "dup@test.com", "password456");
    expect(dup).toBeNull();
  });
});

describe("authenticateUser", () => {
  it("returns null for non-existent email", async () => {
    mockGetResult.mockResolvedValue({ empty: true });
    const user = await authenticateUser("nobody@test.com", "password");
    expect(user).toBeNull();
  });
});
