// Tests for POST /api/auth/invite — generate invite code (protected route)
// These test the expected behavior; actual route handler tests require Next.js request mocking.

import { createInvite, validateInvite } from "@/lib/invites";

describe("invite generation API behavior", () => {
  it("creates an invite that is valid", () => {
    const invite = createInvite("user-1");
    expect(validateInvite(invite.code)).toBe(true);
  });

  it("invite code is a non-empty string", () => {
    const invite = createInvite("user-1");
    expect(invite.code.length).toBeGreaterThanOrEqual(8);
  });
});
