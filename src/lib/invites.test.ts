import { createInvite, validateInvite, redeemInvite } from "./invites";

describe("createInvite", () => {
  it("returns an invite with a code and createdBy field", () => {
    const invite = createInvite("user-1");
    expect(invite.code).toBeDefined();
    expect(typeof invite.code).toBe("string");
    expect(invite.code.length).toBeGreaterThan(0);
    expect(invite.createdBy).toBe("user-1");
    expect(invite.used).toBe(false);
  });

  it("generates unique codes each time", () => {
    const a = createInvite("user-1");
    const b = createInvite("user-1");
    expect(a.code).not.toBe(b.code);
  });
});

describe("validateInvite", () => {
  it("returns true for a valid unused invite code", () => {
    const invite = createInvite("user-1");
    expect(validateInvite(invite.code)).toBe(true);
  });

  it("returns false for an invalid code", () => {
    expect(validateInvite("bogus-code")).toBe(false);
  });

  it("returns false for an already-used code", () => {
    const invite = createInvite("user-1");
    redeemInvite(invite.code);
    expect(validateInvite(invite.code)).toBe(false);
  });
});

describe("redeemInvite", () => {
  it("marks the invite as used and returns true", () => {
    const invite = createInvite("user-1");
    expect(redeemInvite(invite.code)).toBe(true);
    expect(validateInvite(invite.code)).toBe(false);
  });

  it("returns false for an invalid code", () => {
    expect(redeemInvite("bogus")).toBe(false);
  });

  it("returns false if code was already redeemed", () => {
    const invite = createInvite("user-1");
    redeemInvite(invite.code);
    expect(redeemInvite(invite.code)).toBe(false);
  });
});
