// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin
vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: vi.fn().mockResolvedValue(undefined),
      })),
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ empty: true }),
        }),
      }),
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ empty: true }),
      }),
    })),
  },
}));

// Mock users module to control hasUsers
vi.mock("@/lib/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/users")>();
  return {
    ...actual,
    hasUsers: vi.fn().mockResolvedValue(false),
    createUser: vi.fn().mockResolvedValue({
      id: "u1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam-1",
    }),
  };
});

// Mock invites module
vi.mock("@/lib/invites", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/invites")>();
  return {
    ...actual,
    redeemInvite: vi.fn().mockResolvedValue("fam-1"),
  };
});

describe("First-user invite bypass (registration route logic)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip invite validation when hasUsers() returns false", async () => {
    const { hasUsers } = await import("@/lib/users");
    const { redeemInvite } = await import("@/lib/invites");

    vi.mocked(hasUsers).mockResolvedValue(false);

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "First User",
        email: "first@example.com",
        password: "SecurePass123",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(redeemInvite).not.toHaveBeenCalled();
  });

  it("should require invite code when hasUsers() returns true", async () => {
    const { hasUsers } = await import("@/lib/users");
    const { redeemInvite } = await import("@/lib/invites");

    vi.mocked(hasUsers).mockResolvedValue(true);
    vi.mocked(redeemInvite).mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second User",
        email: "second@example.com",
        password: "SecurePass123",
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

    vi.mocked(hasUsers).mockResolvedValue(true);
    vi.mocked(redeemInvite).mockResolvedValue("fam-1");

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second User",
        email: "second@example.com",
        password: "SecurePass123",
        inviteCode: "VALIDCODE123",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(redeemInvite).toHaveBeenCalledWith("VALIDCODE123");
  });

  it("should not require inviteCode field in schema when no users exist", async () => {
    const { hasUsers } = await import("@/lib/users");
    vi.mocked(hasUsers).mockResolvedValue(false);

    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "First User",
        email: "first@example.com",
        password: "SecurePass123",
      }),
    });

    const response = await POST(request as never);
    expect(response.status).not.toBe(400);
  });
});
