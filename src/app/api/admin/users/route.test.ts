// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "./route";
import type { User } from "@/types/auth";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 when requireAdmin fails", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const { NextResponse } = await import("next/server");
    const mockResponse = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    vi.mocked(requireAdmin).mockResolvedValue(mockResponse);

    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("should return all users without passwordHash when user is admin", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);

    const { adminDb } = await import("@/lib/firebase-admin");
    const mockUsersSnapshot = {
      docs: [
        {
          id: "user1",
          data: () => ({
            name: "User One",
            email: "user1@test.com",
            familyId: "fam1",
            role: "member",
            passwordHash: "should-be-excluded",
            createdAt: "2024-01-01T00:00:00Z",
          }),
        },
        {
          id: "admin123",
          data: () => ({
            name: "Admin",
            email: "admin@test.com",
            familyId: "fam1",
            role: "admin",
            passwordHash: "admin-hash",
            createdAt: "2024-01-02T00:00:00Z",
          }),
        },
      ],
    };
    vi.mocked(adminDb.collection).mockReturnValue({
      get: vi.fn().mockResolvedValue(mockUsersSnapshot),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      users: [
        {
          id: "user1",
          name: "User One",
          email: "user1@test.com",
          familyId: "fam1",
          role: "member",
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "admin123",
          name: "Admin",
          email: "admin@test.com",
          familyId: "fam1",
          role: "admin",
          createdAt: "2024-01-02T00:00:00Z",
        },
      ],
    });
    // Verify passwordHash is excluded
    expect(body.users[0]).not.toHaveProperty("passwordHash");
    expect(body.users[1]).not.toHaveProperty("passwordHash");
  });
});

describe("PUT /api/admin/users", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 when requireAdmin fails", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const { NextResponse } = await import("next/server");
    const mockResponse = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    vi.mocked(requireAdmin).mockResolvedValue(mockResponse);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ userId: "user1", targetFamilyId: "fam2" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  it("should return 400 when validation fails", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ userId: "" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it("should update user familyId when data is valid", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);

    const { adminDb } = await import("@/lib/firebase-admin");
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({
      doc: mockDoc,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ userId: "user1", targetFamilyId: "fam2" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ message: "User moved successfully" });
    expect(mockDoc).toHaveBeenCalledWith("user1");
    expect(mockUpdate).toHaveBeenCalledWith({ familyId: "fam2" });
  });
});

describe("DELETE /api/admin/users", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 when requireAdmin fails", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const { NextResponse } = await import("next/server");
    const mockResponse = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    vi.mocked(requireAdmin).mockResolvedValue(mockResponse);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ userId: "user1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it("should return 400 when validation fails", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ userId: "" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(400);
  });

  it("should return 403 when trying to delete self", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ userId: "admin123" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ message: "Cannot delete your own account" });
  });

  it("should delete user when data is valid", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const adminUser: User = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);

    const { adminDb } = await import("@/lib/firebase-admin");
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ delete: mockDelete });
    vi.mocked(adminDb.collection).mockReturnValue({
      doc: mockDoc,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ userId: "user1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ message: "User deleted successfully" });
    expect(mockDoc).toHaveBeenCalledWith("user1");
    expect(mockDelete).toHaveBeenCalled();
  });
});
