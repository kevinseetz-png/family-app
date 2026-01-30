import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn(() => ({ set: mockSet }));
const mockLimit = vi.fn();
const mockGetResult = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      limit: mockLimit,
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ get: mockGetResult });
});

import { hasUsers } from "./users";

describe("hasUsers", () => {
  it("should return false when no users exist", async () => {
    mockGetResult.mockResolvedValue({ empty: true });
    expect(await hasUsers()).toBe(false);
  });

  it("should return true when users exist", async () => {
    mockGetResult.mockResolvedValue({ empty: false });
    expect(await hasUsers()).toBe(true);
  });
});
