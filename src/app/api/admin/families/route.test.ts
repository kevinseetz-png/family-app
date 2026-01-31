// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import type { User } from "@/types/auth";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

describe("GET /api/admin/families", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 when requireAdmin fails", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const { NextResponse } = await import("next/server");
    const mockResponse = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    vi.mocked(requireAdmin).mockResolvedValue(mockResponse);

    const request = new NextRequest("http://localhost:3000/api/admin/families");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("should return families with member counts when user is admin", async () => {
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
    const mockFamiliesSnapshot = {
      docs: [
        {
          id: "fam1",
          data: () => ({ name: "Family One", createdAt: "2024-01-01T00:00:00Z" }),
        },
        {
          id: "fam2",
          data: () => ({ name: "Family Two", createdAt: "2024-01-02T00:00:00Z" }),
        },
      ],
    };
    const mockUsersSnapshot1 = { size: 3 };
    const mockUsersSnapshot2 = { size: 1 };

    let userCallCount = 0;
    vi.mocked(adminDb.collection).mockImplementation((name: string) => {
      if (name === "families") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { get: vi.fn().mockResolvedValue(mockFamiliesSnapshot) } as any;
      }
      if (name === "users") {
        return {
          where: () => {
            userCallCount++;
            return {
              get: vi.fn().mockResolvedValue(userCallCount === 1 ? mockUsersSnapshot1 : mockUsersSnapshot2),
            };
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    });

    const request = new NextRequest("http://localhost:3000/api/admin/families");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      families: [
        { id: "fam1", name: "Family One", memberCount: 3, createdAt: "2024-01-01T00:00:00Z" },
        { id: "fam2", name: "Family Two", memberCount: 1, createdAt: "2024-01-02T00:00:00Z" },
      ],
    });
  });

  it("should return empty array when no families exist", async () => {
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
    const mockFamiliesSnapshot = { docs: [] };
    vi.mocked(adminDb.collection).mockReturnValue({
      get: vi.fn().mockResolvedValue(mockFamiliesSnapshot),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/families");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ families: [] });
  });
});
