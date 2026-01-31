import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSet, mockUpdate, mockGet } = vi.hoisted(() => ({
  mockSet: vi.fn().mockResolvedValue(undefined),
  mockUpdate: vi.fn().mockResolvedValue(undefined),
  mockGet: vi.fn(),
}));

const mockRunTransaction = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({ set: mockSet, update: mockUpdate, get: mockGet }),
    }),
    runTransaction: mockRunTransaction,
  },
}));

import { createInvite, validateInvite, redeemInvite } from "./invites";

describe("createInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an invite with a code, createdBy, and familyId", async () => {
    const invite = await createInvite("user-1", "fam-1");
    expect(invite.code).toBeDefined();
    expect(typeof invite.code).toBe("string");
    expect(invite.code.length).toBeGreaterThan(0);
    expect(invite.createdBy).toBe("user-1");
    expect(invite.familyId).toBe("fam-1");
    expect(invite.used).toBe(false);
    expect(mockSet).toHaveBeenCalled();
  });

  it("generates unique codes each time", async () => {
    const a = await createInvite("user-1", "fam-1");
    const b = await createInvite("user-1", "fam-1");
    expect(a.code).not.toBe(b.code);
  });
});

describe("validateInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true for a valid unused invite code", async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => ({ used: false }) });
    expect(await validateInvite("CODE123")).toBe(true);
  });

  it("returns false for an invalid code", async () => {
    mockGet.mockResolvedValue({ exists: false });
    expect(await validateInvite("bogus-code")).toBe(false);
  });

  it("returns false for an already-used code", async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => ({ used: true }) });
    expect(await validateInvite("USED")).toBe(false);
  });
});

describe("redeemInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks the invite as used and returns familyId", async () => {
    mockRunTransaction.mockImplementation(async (fn: (tx: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }) => Promise<string | null>) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ used: false, familyId: "fam-1", createdAt: new Date() }) }),
        update: mockUpdate,
      };
      return fn(tx);
    });
    expect(await redeemInvite("CODE123")).toBe("fam-1");
    expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), { used: true });
  });

  it("returns null for an invalid code", async () => {
    mockRunTransaction.mockImplementation(async (fn: (tx: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }) => Promise<string | null>) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: mockUpdate,
      };
      return fn(tx);
    });
    expect(await redeemInvite("bogus")).toBeNull();
  });

  it("returns null if code was already redeemed", async () => {
    mockRunTransaction.mockImplementation(async (fn: (tx: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }) => Promise<string | null>) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ used: true, familyId: "fam-1", createdAt: new Date() }) }),
        update: mockUpdate,
      };
      return fn(tx);
    });
    expect(await redeemInvite("USED")).toBeNull();
  });

  it("returns null if invite is expired (>24h)", async () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockRunTransaction.mockImplementation(async (fn: (tx: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }) => Promise<string | null>) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ used: false, familyId: "fam-1", createdAt: oldDate }) }),
        update: mockUpdate,
      };
      return fn(tx);
    });
    expect(await redeemInvite("EXPIRED")).toBeNull();
  });
});
