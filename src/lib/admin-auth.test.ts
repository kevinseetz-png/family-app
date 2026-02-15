// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import type { User } from "@/types/auth";

let mockFirestoreRole = "member";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ role: mockFirestoreRole }) }),
      }),
    }),
  },
  adminAuth: {},
}));

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFirestoreRole = "member";
  });

  it("should return 401 when no auth token cookie is present", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const { verifyToken } = await import("@/lib/auth");

    const result = await requireAdmin(request);

    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body).toEqual({ message: "Unauthorized" });
    }
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      headers: { Cookie: "auth_token=invalid-token" },
    });
    const { verifyToken } = await import("@/lib/auth");
    vi.mocked(verifyToken).mockResolvedValue(null);

    const result = await requireAdmin(request);

    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body).toEqual({ message: "Unauthorized" });
    }
  });

  it("should return 403 when user is not admin", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      headers: { Cookie: "auth_token=valid-member-token" },
    });
    const { verifyToken } = await import("@/lib/auth");
    const memberUser: User = {
      id: "user123",
      name: "Member User",
      email: "member@test.com",
      familyId: "fam123",
      role: "member",
    };
    vi.mocked(verifyToken).mockResolvedValue(memberUser);

    const result = await requireAdmin(request);

    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body).toEqual({ message: "Forbidden" });
    }
  });

  it("should return User object when user is admin", async () => {
    mockFirestoreRole = "admin";
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      headers: { Cookie: "auth_token=valid-admin-token" },
    });
    const { verifyToken } = await import("@/lib/auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin User",
      email: "admin@test.com",
      familyId: "fam123",
      role: "admin",
    };
    vi.mocked(verifyToken).mockResolvedValue(adminUser);

    const result = await requireAdmin(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(adminUser);
  });
});
