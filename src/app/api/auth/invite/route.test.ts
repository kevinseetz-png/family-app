// Tests for POST /api/auth/invite — generate invite code (protected route)
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({ set: vi.fn().mockResolvedValue(undefined) })),
    })),
  },
}));

import { createInvite } from "@/lib/invites";

describe("invite generation API behavior", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an invite that is valid", async () => {
    const invite = await createInvite("user-1", "fam-1");
    expect(invite.code).toBeDefined();
    expect(invite.familyId).toBe("fam-1");
  });

  it("invite code is a non-empty string", async () => {
    const invite = await createInvite("user-1", "fam-1");
    expect(invite.code.length).toBeGreaterThanOrEqual(8);
  });
});
