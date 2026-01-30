import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the "first user bypasses invite code" feature.
 *
 * When the user store is empty, registration should succeed without an invite code.
 * When at least one user exists, the invite code is required as before.
 */

// Mock users module to control hasUsers
vi.mock("@/lib/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/users")>();
  return {
    ...actual,
    hasUsers: vi.fn(() => false),
  };
});

// Mock invites module
vi.mock("@/lib/invites", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/invites")>();
  return {
    ...actual,
    redeemInvite: vi.fn(() => true),
  };
});

describe("First-user invite bypass (registration route logic)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip invite validation when hasUsers() returns false", async () => {
    const { hasUsers } = await import("@/lib/users");
    const { redeemInvite } = await import("@/lib/invites");

    // Simulate: no users exist
    vi.mocked(hasUsers).mockReturnValue(false);

    // The register route should NOT call redeemInvite when no users exist.
    // We test this by importing the route and calling it.
    // Since the route currently ALWAYS calls redeemInvite, this test will fail.
    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "First User",
        email: "first@example.com",
        password: "securepassword",
        // No inviteCode provided
      }),
    });

    const response = await POST(request as never);
    // First user should be created successfully without invite code
    expect(response.status).toBe(201);
    expect(redeemInvite).not.toHaveBeenCalled();
  });

  it("should require invite code when hasUsers() returns true", async () => {
    const { hasUsers } = await import("@/lib/users");
    const { redeemInvite } = await import("@/lib/invites");

    // Simulate: users already exist
    vi.mocked(hasUsers).mockReturnValue(true);
    vi.mocked(redeemInvite).mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second User",
        email: "second@example.com",
        password: "securepassword",
        inviteCode: "INVALID",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(403);
    expect(redeemInvite).toHaveBeenCalledWith("INVALID");
  });

  it("should allow registration with valid invite when users exist", async () => {
    const { hasUsers } = await import("@/lib/users");
    const { redeemInvite } = await import("@/lib/invites");

    vi.mocked(hasUsers).mockReturnValue(true);
    vi.mocked(redeemInvite).mockReturnValue(true);

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second User",
        email: "second@example.com",
        password: "securepassword",
        inviteCode: "VALIDCODE123",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(redeemInvite).toHaveBeenCalledWith("VALIDCODE123");
  });

  it("should not require inviteCode field in schema when no users exist", async () => {
    // The validation schema should make inviteCode optional when no users exist.
    // Currently registerSchema requires inviteCode, so submitting without it
    // returns 400. This test expects 201 for the first user without inviteCode.
    const { hasUsers } = await import("@/lib/users");
    vi.mocked(hasUsers).mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "First User",
        email: "first@example.com",
        password: "securepassword",
        // No inviteCode
      }),
    });

    const response = await POST(request as never);
    // Should not fail validation for missing inviteCode
    expect(response.status).not.toBe(400);
  });
});
